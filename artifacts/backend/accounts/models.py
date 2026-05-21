from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'Admin'),
        ('user', 'User'),
        ('guest', 'Guest'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=15, blank=True)
    device_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True)


class EmailOTP(models.Model):
    PURPOSE_CHOICES = [
        ('login', 'Login'),
        ('register', 'Register'),
    ]
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['email', 'purpose', 'is_used']),
        ]

    def __str__(self):
        return f"{self.email} ({self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at
