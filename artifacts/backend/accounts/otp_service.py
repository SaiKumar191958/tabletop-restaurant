import logging
import random
import string
from datetime import timedelta

import resend
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone

from .models import CustomUser, EmailOTP

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = getattr(settings, "OTP_EXPIRY_MINUTES", 10)
OTP_LENGTH = getattr(settings, "OTP_LENGTH", 6)
OTP_RESEND_SECONDS = getattr(settings, "OTP_RESEND_SECONDS", 60)

if getattr(settings, "RESEND_API_KEY", None):
    resend.api_key = settings.RESEND_API_KEY


def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def request_otp(email: str, purpose: str) -> dict:
    email = _normalize_email(email)
    if not email:
        raise ValueError("Email is required.")

    if purpose not in ("login", "register"):
        raise ValueError("Invalid purpose.")

    if purpose == "login":
        if not CustomUser.objects.filter(email__iexact=email).exists():
            raise LookupError("No account found with this email. Please register first.")

    if purpose == "register":
        if CustomUser.objects.filter(email__iexact=email).exists():
            raise ValueError("An account with this email already exists. Please sign in.")

    latest = (
        EmailOTP.objects.filter(email=email, purpose=purpose, is_used=False)
        .order_by("-created_at")
        .first()
    )
    if latest:
        elapsed = (timezone.now() - latest.created_at).total_seconds()
        if elapsed < OTP_RESEND_SECONDS:
            wait = int(OTP_RESEND_SECONDS - elapsed)
            raise ValueError(f"Please wait {wait}s before requesting another code.")

    # Specific test accounts can use a static code
    test_emails = ["user@tabletop.com", "admin@tabletop.com", "super@tabletop.com"]
    if email in test_emails:
        code = "123456"
    else:
        code = _generate_code()

    expires_at = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    EmailOTP.objects.create(email=email, code=code, purpose=purpose, expires_at=expires_at)

    # Skip real email for test accounts
    if email in test_emails:
        return {
            "email": email,
            "purpose": purpose,
            "expires_in_minutes": OTP_EXPIRY_MINUTES,
            "delivery": "static",
            "message": f"Test account detected. Use code 123456 for {email}.",
        }

    email_sent = False
    try:
        email_sent = _send_otp_email(email, code, purpose)
    except ValueError:
        if not getattr(settings, "OTP_SHOW_IN_API", False):
            raise

    delivery = getattr(settings, "EMAIL_OTP_DELIVERY", "console")
    result = {
        "email": email,
        "purpose": purpose,
        "expires_in_minutes": OTP_EXPIRY_MINUTES,
        "delivery": delivery,
        "message": (
            f"Verification code sent to {email}."
            if email_sent
            else f"Verification code logged to server console (configure EMAIL_HOST in .env to send real email)."
        ),
    }
    # Only expose OTP in JSON when email failed (debug fallback) — never when mail was sent
    if not email_sent and getattr(settings, "OTP_SHOW_IN_API", False):
        result["demo_otp"] = code
        result["message"] = (
            f"Email could not be sent. Use demo_otp from this response for {email}."
        )
    return result


def _send_otp_email(email: str, code: str, purpose: str) -> bool:
    action = "sign in to Sri Durga Military Hotel" if purpose == "login" else "complete your Sri Durga Military Hotel registration"
    subject = "Your Sri Durga Military Hotel verification code"

    text_body = (
        f"Hello,\n\n"
        f"Your verification code to {action} is:\n\n"
        f"    {code}\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes.\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f"— Sri Durga Military Hotel"
    )

    html_body = f"""
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #e85d04; margin-bottom: 8px;">Sri Durga Military Hotel</h2>
      <p style="color: #444;">Your verification code to {action}:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111;
         background: #f5f5f5; padding: 16px 24px; border-radius: 8px; text-align: center;">
        {code}
      </p>
      <p style="color: #666; font-size: 14px;">
        Expires in {OTP_EXPIRY_MINUTES} minutes. If you did not request this, ignore this email.
      </p>
    </div>
    """

    try:
        delivery_mode = getattr(settings, "EMAIL_OTP_DELIVERY", "console")

        if delivery_mode == "resend":
            params = {
                "from": settings.DEFAULT_FROM_EMAIL or "onboarding@resend.dev",
                "to": [email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
            resend.Emails.send(params)
            logger.info("OTP email sent to %s via Resend API", email)
            return True

        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
        logger.info("OTP email sent to %s via %s", email, delivery_mode)
        return True
    except Exception as exc:
        logger.exception("Failed to send OTP email to %s", email)
        # Return the actual error message to help the user debug SMTP/API issues
        raise ValueError(f"Email Delivery Error: {str(exc)}") from exc


def verify_otp(
    email: str,
    code: str,
    purpose: str,
    *,
    username: str = "",
    phone: str = "",
) -> CustomUser:
    email = _normalize_email(email)
    code = code.strip()

    if not email or not code:
        raise ValueError("Email and verification code are required.")

    otp = (
        EmailOTP.objects.filter(
            email=email,
            purpose=purpose,
            is_used=False,
            code=code,
        )
        .order_by("-created_at")
        .first()
    )

    if not otp:
        raise ValueError("Invalid or expired verification code.")

    if otp.expires_at < timezone.now():
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        raise ValueError("Verification code has expired. Request a new one.")

    otp.is_used = True
    otp.save(update_fields=["is_used"])

    if purpose == "login":
        user = CustomUser.objects.filter(email__iexact=email).first()
        if not user:
            raise LookupError("No account found with this email.")
        return user

    username = username.strip()
    if not username:
        raise ValueError("Username is required for registration.")

    if CustomUser.objects.filter(username__iexact=username).exists():
        raise ValueError("This username is already taken.")

    user = CustomUser.objects.create(
        username=username,
        email=email,
        phone=phone.strip(),
        role="user",
    )
    user.set_unusable_password()
    user.save()
    return user
