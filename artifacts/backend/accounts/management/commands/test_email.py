from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Send a test email to verify SMTP settings in .env"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Recipient email address")

    def handle(self, *args, **options):
        recipient = options["email"]
        delivery = getattr(settings, "EMAIL_OTP_DELIVERY", "unknown")

        self.stdout.write(f"Delivery mode: {delivery}")
        self.stdout.write(f"EMAIL_HOST: {settings.EMAIL_HOST or '(not set)'}")
        self.stdout.write(f"EMAIL_USER: {settings.EMAIL_HOST_USER or '(not set)'}")
        self.stdout.write(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        self.stdout.write(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        self.stdout.write(f"EMAIL_USE_SSL: {settings.EMAIL_USE_SSL}")
        self.stdout.write(f"FROM: {settings.DEFAULT_FROM_EMAIL}")

        pwd = settings.EMAIL_HOST_PASSWORD or ""
        if not settings.EMAIL_HOST or not settings.EMAIL_HOST_USER or not pwd:
            self.stderr.write(self.style.ERROR(
                "Missing EMAIL_HOST, EMAIL_HOST_USER, or EMAIL_HOST_PASSWORD in .env"
            ))
            return
        if "your-" in pwd.lower() or "password" in pwd.lower() and len(pwd) < 20:
            self.stderr.write(self.style.ERROR(
                "EMAIL_HOST_PASSWORD still looks like the .env.example placeholder.\n"
                "Use a Gmail App Password: https://myaccount.google.com/apppasswords"
            ))
            return

        send_mail(
            subject="TableTop — test email",
            message="If you received this, SMTP is configured correctly.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        )
        self.stdout.write(self.style.SUCCESS(f"Test email sent to {recipient}"))
