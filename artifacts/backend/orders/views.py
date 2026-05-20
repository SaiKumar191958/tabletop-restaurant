from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Order
from .serializers import OrderSerializer
from accounts.permissions import IsAdminOrSuperAdmin

class OrderCreateListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = (IsAdminOrSuperAdmin,)

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
