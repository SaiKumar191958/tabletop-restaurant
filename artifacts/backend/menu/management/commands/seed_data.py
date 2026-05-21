from django.core.management.base import BaseCommand
from menu.models import Category, FoodItem, RestaurantConfig
from django.core.files.base import ContentFile
import requests

class Command(BaseCommand):
    help = 'Seed data for Sri Durga Military Hotel'

    def handle(self, *args, **options):
        # 1. Create Restaurant Config only if it doesn't exist
        config, created = RestaurantConfig.objects.get_or_create(
            id=1,
            defaults={
                "name": "Sri Durga Military Hotel",
                "packing_charge": 20.00,
                "delivery_charge_info": "Delivery charges depend on distance",
                "bulk_order_info": "Bulk order available (6hrs advance booking)",
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Successfully created default restaurant config'))
        else:
            self.stdout.write(self.style.WARNING('Restaurant config already exists, skipping defaults'))

        # 2. Create Categories
        categories = {
            'Main Course': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=800',
            'Starters & Sides': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=800',
            'Combos': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
        }

        cat_objs = {}
        for cat_name, img_url in categories.items():
            cat, created = Category.objects.get_or_create(name=cat_name)
            if not cat.image_url:
                cat.image_url = img_url
                cat.save()
            cat_objs[cat_name] = cat

        self.stdout.write(self.style.SUCCESS('Successfully created categories'))

        # 3. Create Food Items
        food_items = [
            {'name': 'White rice', 'price': 60, 'cat': 'Main Course', 'type': 'veg', 'desc': 'Steamed white rice'},
            {'name': 'Chicken curry', 'price': 180, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Spicy chicken curry'},
            {'name': 'Chicken fry', 'price': 160, 'cat': 'Starters & Sides', 'type': 'nonveg', 'desc': 'Deep fried chicken pieces'},
            {'name': 'Mutton curry', 'price': 250, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Traditional mutton curry'},
            {'name': 'Mutton boti curry', 'price': 200, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Mutton boti curry'},
            {'name': 'Fish curry', 'price': 220, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Tangy fish curry'},
            {'name': 'Crab curry', 'price': 240, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Spicy crab curry'},
            {'name': 'Prawn curry', 'price': 230, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Delicious prawn curry'},
            {'name': 'Natu kodi curry', 'price': 280, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Country chicken curry'},
            {'name': 'Boiled egg', 'price': 15, 'cat': 'Starters & Sides', 'type': 'nonveg', 'desc': 'Single boiled egg'},
            {'name': 'Egg omlet', 'price': 40, 'cat': 'Starters & Sides', 'type': 'nonveg', 'desc': 'Spicy egg omelette'},
            {'name': 'Sambar', 'price': 40, 'cat': 'Starters & Sides', 'type': 'veg', 'desc': 'South Indian lentil stew'},
            {'name': 'Rasam', 'price': 30, 'cat': 'Starters & Sides', 'type': 'veg', 'desc': 'Spicy tamarind soup'},
            {'name': 'Veg fry', 'price': 80, 'cat': 'Starters & Sides', 'type': 'veg', 'desc': 'Assorted vegetable fry'},
            {'name': 'Curd rice', 'price': 70, 'cat': 'Main Course', 'type': 'veg', 'desc': 'Creamy curd rice'},
            {'name': 'Papad', 'price': 10, 'cat': 'Starters & Sides', 'type': 'veg', 'desc': 'Crispy papad'},
            {'name': 'Mutton head curry', 'price': 220, 'cat': 'Main Course', 'type': 'nonveg', 'desc': 'Traditional mutton head curry'},
            {'name': 'Chicken Liver fry', 'price': 150, 'cat': 'Starters & Sides', 'type': 'nonveg', 'desc': 'Spicy chicken liver fry'},
            {'name': 'Mutton Liver fry', 'price': 180, 'cat': 'Starters & Sides', 'type': 'nonveg', 'desc': 'Spicy mutton liver fry'},
            {
                'name': 'Combo pack', 
                'price': 199, 
                'cat': 'Combos', 
                'type': 'nonveg', 
                'desc': 'Rice with chicken curry + Mutton curry + Fish curry + egg'
            },
        ]

        for item in food_items:
            FoodItem.objects.update_or_create(
                name=item['name'],
                defaults={
                    'price': item['price'],
                    'category': cat_objs[item['cat']],
                    'food_type': item['type'],
                    'description': item['desc'],
                    'is_available': True,
                    'rating': 4.5
                }
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded food items'))
