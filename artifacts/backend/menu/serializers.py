from rest_framework import serializers
from .models import Category, FoodItem, RestaurantConfig


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = Category
        fields = '__all__'

    def validate(self, attrs):
        image = attrs.get('image')
        image_url = attrs.get('image_url')
        
        # If both are provided in the request, fail
        if image and image_url:
            raise serializers.ValidationError(
                {'image': 'Provide either an uploaded image or an image URL, not both.'}
            )
        return attrs

    def update(self, instance, validated_data):
        # If a new image file is uploaded
        if 'image' in validated_data and validated_data['image']:
            instance.image_url = ''
        # If an image URL is provided (not empty)
        elif 'image_url' in validated_data and validated_data['image_url']:
            instance.image = None
        # If image_url is explicitly set to empty (clearing image)
        elif 'image_url' in validated_data and validated_data['image_url'] == '':
            instance.image = None
            
        return super().update(instance, validated_data)

    def create(self, validated_data):
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image_url:
            data['image'] = instance.image_url
        elif instance.image:
            request = self.context.get('request')
            url = instance.image.url
            data['image'] = request.build_absolute_uri(url) if request else url
        else:
            data['image'] = None
        return data


class FoodItemSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source='category', queryset=Category.objects.all(), write_only=True
    )
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = FoodItem
        fields = (
            'id', 'name', 'description', 'price', 'image', 'image_url', 'food_type',
            'is_available', 'rating', 'category', 'category_id',
            'default_stock', 'current_stock', 'weekday_stock'
        )

    def validate(self, attrs):
        image = attrs.get('image')
        image_url = attrs.get('image_url')
        if image and image_url:
            raise serializers.ValidationError(
                {'image': 'Provide either an uploaded image or an image URL, not both.'}
            )
        return attrs

    def update(self, instance, validated_data):
        if 'image' in validated_data and validated_data['image']:
            instance.image_url = ''
        elif 'image_url' in validated_data and validated_data['image_url']:
            instance.image = None
        elif 'image_url' in validated_data and validated_data['image_url'] == '':
            instance.image = None
            
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image_url:
            data['image'] = instance.image_url
        elif instance.image:
            request = self.context.get('request')
            url = instance.image.url
            data['image'] = request.build_absolute_uri(url) if request else url
        else:
            data['image'] = None
        return data

class RestaurantConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantConfig
        fields = '__all__'
