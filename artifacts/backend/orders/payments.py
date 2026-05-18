"""Static (demo) payment processing — mimics Razorpay flow without real API calls."""

import secrets
from django.utils import timezone

# Test card that simulates failure in demo mode
DEMO_FAIL_CARD = "4111111111110000"


def generate_static_payment_id() -> str:
    return f"pay_static_{secrets.token_hex(8)}"


def generate_static_order_id() -> str:
    return f"order_static_{secrets.token_hex(8)}"


def apply_static_payment(order, payment_method: str, *, card_number: str = "") -> order:
    """
    Apply demo payment result to an order after it is created.

    - cod: unpaid, stays pending
    - upi / card: auto-paid with fake reference (unless demo fail card)
    """
    order.payment_method = payment_method
    order.payment_provider = "static"

    if payment_method == "cod":
        order.payment_status = "unpaid"
        order.payment_reference = ""
        order.paid_at = None
        if order.status == "pending":
            pass  # keep pending
        return order

    # Online methods (UPI / card) — simulate Razorpay success
    card_digits = "".join(c for c in (card_number or "") if c.isdigit())
    if payment_method == "card" and card_digits == DEMO_FAIL_CARD:
        order.payment_status = "failed"
        order.payment_reference = f"pay_failed_{secrets.token_hex(6)}"
        order.paid_at = None
        order.status = "cancelled"
        return order

    order.payment_status = "paid"
    order.payment_reference = generate_static_payment_id()
    order.paid_at = timezone.now()
    if order.status == "pending":
        order.status = "confirmed"
    return order
