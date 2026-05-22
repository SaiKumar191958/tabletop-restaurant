from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order, DailyReport, DailyItemReport, OrderItem
from .serializers import OrderSerializer, DailyReportSerializer
from accounts.permissions import IsAdminOrSuperAdmin, IsSuperAdmin
from menu.models import FoodItem
from django.utils import timezone
from django.db.models import Sum, Count
import datetime

class DailyReportListView(generics.ListAPIView):
    queryset = DailyReport.objects.all().order_by('-date')
    serializer_class = DailyReportSerializer
    permission_classes = (IsAdminOrSuperAdmin,)

class EndDayView(APIView):
    """Generates a summary report for the day's sales and remaining stock."""
    permission_classes = (IsAdminOrSuperAdmin,)

    def post(self, request):
        today = timezone.localtime().date()
        date_str = request.data.get('date')
        if date_str:
            try:
                today = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
            
        day_name = today.strftime('%A')
        
        # Check if report already exists
        report, created = DailyReport.objects.get_or_create(date=today, defaults={'day_name': day_name})
        
        # Calculate stats for the day
        orders = Order.objects.filter(created_at__date=today).exclude(status='cancelled')
        report.total_orders = orders.count()
        report.total_revenue = orders.aggregate(total=Sum('total_price'))['total'] or 0
        
        # Count distinct users (authenticated + guests by device_id)
        active_auth_users = orders.exclude(user__isnull=True).values('user').distinct().count()
        active_guests = orders.filter(user__isnull=True).values('device_id').distinct().count()
        report.total_users_active = active_auth_users + active_guests
        report.save()
        
        # Clear existing item reports for this day and recreate
        report.item_reports.all().delete()
        
        all_items = FoodItem.objects.all()
        for item in all_items:
            # How many were sold today
            sold = OrderItem.objects.filter(
                order__created_at__date=today, 
                food_item=item
            ).exclude(order__status='cancelled').aggregate(total=Sum('quantity'))['total'] or 0
            
            DailyItemReport.objects.create(
                report=report,
                food_item=item,
                quantity_sold=sold,
                quantity_left=item.current_stock,
                revenue=sold * item.price
            )
            
        return Response(DailyReportSerializer(report).data)

class StartDayView(APIView):
    """Resets the current stock of all items to their default values."""
    permission_classes = (IsAdminOrSuperAdmin,)

    def post(self, request):
        items = FoodItem.objects.all()
        count = 0
        for item in items:
            item.current_stock = item.default_stock
            item.save()
            count += 1
        
        return Response({
            "message": f"Successfully reset stock for {count} items.",
            "reset_at": timezone.now()
        })

class OrderCreateListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user).order_by('-created_at')

        device_id = self.request.query_params.get('device_id')
        if device_id:
            return Order.objects.filter(device_id=device_id, is_guest=True).order_by('-created_at')

        return Order.objects.none()


class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = (IsAdminOrSuperAdmin,)

class AdminOrderUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = (IsSuperAdmin,)

class OrderStatusUpdateView(APIView):
    permission_classes = (IsAdminOrSuperAdmin,)

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
            status_val = request.data.get('status')
            if status_val in dict(Order.STATUS):
                order.status = status_val
                
                # Auto-mark as paid if delivered
                if status_val == 'delivered':
                    order.payment_status = 'paid'
                    from django.utils import timezone
                    order.paid_at = timezone.now()
                
                order.save()
                return Response(OrderSerializer(order).data)
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
