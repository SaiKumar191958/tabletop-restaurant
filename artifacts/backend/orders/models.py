from django.db import models
from django.conf import settings
from menu.models import FoodItem

class Order(models.Model):
    STATUS = [
        ('pending','Pending'),
        ('confirmed','Confirmed'),
        ('preparing','Preparing'),
        ('delivered','Delivered'),
        ('cancelled','Cancelled')
    ]
    PAYMENT_METHOD = [
        ('cod', 'Cash on Delivery'),
        ('upi', 'UPI'),
        ('card', 'Card'),
    ]
    PAYMENT_STATUS = [
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    is_guest = models.BooleanField(default=False)
    device_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    packing_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    address = models.TextField()
    phone = models.CharField(max_length=20, default='')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD, default='cod')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='unpaid')
    payment_provider = models.CharField(max_length=20, default='static', blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        username = self.user.username if self.user else f"Guest ({self.phone})"
        return f"Order {self.id} - {username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.food_item.name}"

class DailyReport(models.Model):
    date = models.DateField(unique=True)
    day_name = models.CharField(max_length=20)
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_users_active = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for {self.date} ({self.day_name})"

class DailyItemReport(models.Model):
    report = models.ForeignKey(DailyReport, related_name='item_reports', on_delete=models.CASCADE)
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity_sold = models.PositiveIntegerField(default=0)
    quantity_left = models.PositiveIntegerField(default=0)
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.food_item.name} on {self.report.date}"
