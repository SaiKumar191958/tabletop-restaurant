from django.core.management.base import BaseCommand
from django.utils import timezone
from menu.models import FoodItem

class Command(BaseCommand):
    help = 'Reset daily stock for food items based on default_stock or weekday_stock'

    def handle(self, *args, **options):
        now = timezone.localtime()
        current_day = now.strftime('%a') # Mon, Tue, etc.
        
        items = FoodItem.objects.all()
        count = 0
        
        for item in items:
            # Check if there's a specific stock for this weekday
            if item.weekday_stock and current_day in item.weekday_stock:
                item.current_stock = item.weekday_stock[current_day]
            else:
                item.current_stock = item.default_stock
                
            item.save()
            count += 1
            
        self.stdout.write(self.style.SUCCESS(f'Successfully reset stock for {count} items for {current_day}'))
