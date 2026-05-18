from django.db.models import Sum, Q
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomUser
from accounts.permissions import IsAdminOrSuperAdmin
from menu.models import FoodItem
from orders.models import Order
from orders.serializers import OrderSerializer


class DashboardStatsView(APIView):
    permission_classes = (IsAdminOrSuperAdmin,)

    def get(self, request):
        statuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"]
        orders_by_status = [
            {"status": status, "count": Order.objects.filter(status=status).count()}
            for status in statuses
        ]
        recent_orders = Order.objects.order_by("-created_at")[:5]

        paid_orders = Order.objects.filter(
            Q(payment_status="paid") | Q(payment_method="cod", payment_status="unpaid")
        )
        total_revenue = paid_orders.aggregate(total=Sum("total_price"))["total"]

        return Response(
            {
                "total_orders": Order.objects.count(),
                "total_revenue": float(total_revenue or 0),
                "total_users": CustomUser.objects.count(),
                "total_menu_items": FoodItem.objects.count(),
                "orders_by_status": orders_by_status,
                "recent_orders": OrderSerializer(recent_orders, many=True).data,
            }
        )
