from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer
from accounts.permissions import IsAdminOrSuperAdmin, IsSuperAdmin

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
