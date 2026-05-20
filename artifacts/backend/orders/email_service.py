import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import resend

logger = logging.getLogger(__name__)

def send_order_notification_to_admin(order):
    """
    Send an email notification to the restaurant admin when a new order is placed.
    """
    subject = f"New Order Received! Order #{order.id}"
    
    # Construct item list for email
    items_html = "<ul>"
    for item in order.items.all():
        items_html += f"<li>{item.quantity} x {item.food_item.name} - ₹{item.price}</li>"
    items_html += "</ul>"

    text_body = (
        f"New Order Received!\n\n"
        f"Order ID: #{order.id}\n"
        f"Customer: {order.user.username} ({order.user.email})\n"
        f"Total Amount: ₹{order.total_price}\n"
        f"Address: {order.address}\n"
        f"Payment Method: {order.get_payment_method_display()}\n\n"
        f"Please log in to the admin panel to manage this order."
    )

    html_body = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #e85d04; border-bottom: 2px solid #f5f5f5; padding-bottom: 12px;">New Order Notification</h2>
      <p><strong>Order ID:</strong> #{order.id}</p>
      <p><strong>Customer:</strong> {order.user.username} ({order.user.email})</p>
      <p><strong>Delivery Address:</strong> {order.address}</p>
      <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin-top: 0;"><strong>Items Ordered:</strong></p>
        {items_html}
        <hr style="border: 0; border-top: 1px solid #ddd;" />
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 0;">Total: ₹{order.total_price}</p>
      </div>
      <p><strong>Payment Method:</strong> {order.get_payment_method_display()}</p>
      <p style="margin-top: 24px;">
        <a href="https://tabletop-restaurant.vercel.app/admin/orders" 
           style="background: #e85d04; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
           Manage Order in Dashboard
        </a>
      </p>
    </div>
    """

    try:
        delivery_mode = getattr(settings, "EMAIL_OTP_DELIVERY", "console")
        admin_email = getattr(settings, "EMAIL_HOST_USER", "admin@sridurgahotel.local")

        if delivery_mode == "resend" and getattr(settings, "RESEND_API_KEY", None):
            resend.api_key = settings.RESEND_API_KEY
            params = {
                "from": settings.DEFAULT_FROM_EMAIL or "onboarding@resend.dev",
                "to": [admin_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
            resend.Emails.send(params)
            logger.info("Order notification sent to admin via Resend")
            return True

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[admin_email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
        logger.info("Order notification sent to admin via %s", delivery_mode)
        return True
    except Exception:
        logger.exception("Failed to send order notification email to admin")
        return False
