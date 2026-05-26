from django.db import models
from django.conf import settings
from django.db.models import Avg

class Category(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default='')

    def __str__(self):
        return self.name

class FoodItem(models.Model):
    VEG = 'veg'
    NONVEG = 'nonveg'
    TYPE_CHOICES = [(VEG, 'Veg'), (NONVEG, 'Non-Veg')]

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='food/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True, default='')
    food_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    is_available = models.BooleanField(default=True)
    rating = models.FloatField(default=0.0)
    
    # Stock management
    default_stock = models.PositiveIntegerField(default=10)
    current_stock = models.PositiveIntegerField(default=10)
    weekday_stock = models.JSONField(default=dict, blank=True, help_text="Stock per weekday (e.g., {'Mon': 10, 'Sun': 20})")

    def __str__(self):
        return self.name

    def update_rating(self):
        avg_rating = self.ratings.aggregate(Avg('score'))['score__avg']
        self.rating = avg_rating or 0.0
        self.save(update_fields=['rating'])

class Rating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='item_ratings')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='ratings')
    score = models.PositiveSmallIntegerField(default=5)
    review = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'food_item')

    def __str__(self):
        return f"{self.user.username} rated {self.food_item.name}: {self.score}"

class RestaurantConfig(models.Model):
    name = models.CharField(max_length=200, default="Sri Durga Military Hotel")
    packing_charge = models.DecimalField(max_digits=8, decimal_places=2, default=20.00)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    delivery_charge_info = models.CharField(max_length=255, default="Delivery charges depend on distance")
    bulk_order_info = models.CharField(max_length=255, default="Bulk order available (6hrs advance booking)")
    
    # Restaurant Timing
    opening_time = models.TimeField(default="09:00:00")
    closing_time = models.TimeField(default="22:00:00")
    weekday_timing = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Opening/closing per weekday (e.g., {'Mon': {'open': '09:00', 'close': '22:00'}})"
    )
    last_stock_reset_date = models.DateField(null=True, blank=True)
    last_report_generated_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name

# Signals to update FoodItem rating
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Rating)
@receiver(post_delete, sender=Rating)
def update_food_item_rating(sender, instance, **kwargs):
    instance.food_item.update_rating()
