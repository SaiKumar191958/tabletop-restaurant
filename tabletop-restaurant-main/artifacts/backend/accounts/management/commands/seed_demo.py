from django.core.management.base import BaseCommand

from accounts.models import CustomUser
from menu.models import Category, FoodItem


DEMO_USERS = [
    ("super", "super@tabletop.com", "super123", "superadmin"),
    ("admin", "admin@tabletop.com", "admin123", "admin"),
    ("user", "user@tabletop.com", "user123", "user"),
]

CATEGORIES = ["Burgers", "Pizza", "Pasta", "Salads", "Desserts", "Drinks"]

MENU_ITEMS = [
    ("Classic Beef Burger", "Juicy beef patty with lettuce, tomato, and our signature sauce", 12.99, "nonveg", "Burgers", 4.8),
    ("Chicken Avocado Burger", "Grilled chicken breast with fresh avocado and chipotle mayo", 13.99, "nonveg", "Burgers", 4.6),
    ("Veggie Delight Burger", "House-made black bean patty with roasted peppers", 11.99, "veg", "Burgers", 4.3),
    ("Margherita Pizza", "San Marzano tomatoes, fresh mozzarella, and basil on thin crust", 14.99, "veg", "Pizza", 4.7),
    ("BBQ Chicken Pizza", "Smoky BBQ sauce, grilled chicken, red onions, and mozzarella", 16.99, "nonveg", "Pizza", 4.5),
    ("Truffle Mushroom Pizza", "Truffle oil, wild mushrooms, fontina, and fresh thyme", 17.99, "veg", "Pizza", 4.9),
    ("Spaghetti Carbonara", "Creamy egg sauce with pancetta, pecorino, and black pepper", 15.99, "nonveg", "Pasta", 4.7),
    ("Penne Arrabbiata", "Spicy tomato sauce with garlic and fresh herbs", 13.99, "veg", "Pasta", 4.4),
    ("Caesar Salad", "Crisp romaine, parmesan shavings, croutons, and classic Caesar dressing", 10.99, "veg", "Salads", 4.5),
    ("Grilled Chicken Salad", "Mixed greens, grilled chicken, cherry tomatoes, and balsamic vinaigrette", 12.99, "nonveg", "Salads", 4.6),
    ("Tiramisu", "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream", 7.99, "veg", "Desserts", 4.9),
    ("Chocolate Lava Cake", "Warm chocolate cake with a molten center, served with vanilla ice cream", 8.99, "veg", "Desserts", 4.8),
    ("Fresh Lemonade", "Hand-squeezed lemonade with mint and a hint of ginger", 4.99, "veg", "Drinks", 4.6),
    ("Mango Lassi", "Thick and creamy yogurt drink blended with fresh mango", 5.49, "veg", "Drinks", 4.7),
]


class Command(BaseCommand):
    help = "Seed demo users, categories, and menu items for local development"

    def handle(self, *args, **options):
        for username, email, password, role in DEMO_USERS:
            user, created = CustomUser.objects.get_or_create(
                username=username,
                defaults={"email": email, "role": role},
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {username}"))
            else:
                user.set_password(password)
                user.email = email
                user.role = role
                user.save()
                self.stdout.write(f"Updated user: {username}")

        cat_map = {}
        for name in CATEGORIES:
            cat, created = Category.objects.get_or_create(name=name)
            cat_map[name] = cat
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {name}"))

        for name, desc, price, food_type, cat_name, rating in MENU_ITEMS:
            category = cat_map[cat_name]
            _, created = FoodItem.objects.get_or_create(
                name=name,
                category=category,
                defaults={
                    "description": desc,
                    "price": price,
                    "food_type": food_type,
                    "is_available": True,
                    "rating": rating,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created menu item: {name}"))

        self.stdout.write(
            self.style.SUCCESS(
                "Demo data ready. Sign in with email OTP:\n"
                "  user@tabletop.com | admin@tabletop.com | super@tabletop.com\n"
                "  (OTP printed in runserver console when DEBUG=True)"
            )
        )
