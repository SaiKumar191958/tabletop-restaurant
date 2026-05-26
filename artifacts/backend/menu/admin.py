from django.contrib import admin
from .models import Category, FoodItem, RestaurantConfig, Rating

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('user', 'food_item', 'score', 'created_at')
    list_filter = ('score', 'created_at')
    search_fields = ('user__username', 'food_item__name', 'review')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'food_type', 'is_available')
    list_filter = ('category', 'food_type', 'is_available')
    search_fields = ('name', 'description')

@admin.register(RestaurantConfig)
class RestaurantConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'packing_charge')
