from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .payments import DEMO_FAIL_CARD


class PaymentConfigView(APIView):
    """Public config for checkout — currently static/demo mode only."""

    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({
            "mode": "static",
            "provider": "razorpay_demo",
            "currency": "INR",
            "display_currency": "USD",
            "message": (
                "Payments run in demo mode. No real money is charged. "
                "Replace with Razorpay Checkout when keys are configured."
            ),
            "methods": [
                {"id": "upi", "label": "UPI", "enabled": True},
                {"id": "card", "label": "Card", "enabled": True},
                {"id": "cod", "label": "Cash on Delivery", "enabled": True},
            ],
            "demo_fail_card": DEMO_FAIL_CARD,
            "razorpay_required_for_live": {
                "account": "Razorpay merchant account (https://dashboard.razorpay.com)",
                "env_vars": [
                    "RAZORPAY_KEY_ID",
                    "RAZORPAY_KEY_SECRET",
                    "RAZORPAY_WEBHOOK_SECRET",
                ],
                "backend_packages": ["razorpay"],
                "frontend_packages": [],
                "endpoints_to_add": [
                    "POST /api/payments/razorpay/create-order/",
                    "POST /api/payments/razorpay/verify/",
                    "POST /api/payments/razorpay/webhook/",
                ],
                "dashboard_setup": [
                    "Enable Payment Gateway",
                    "Add webhook URL (HTTPS)",
                    "Whitelist domain for Checkout",
                ],
            },
        })
