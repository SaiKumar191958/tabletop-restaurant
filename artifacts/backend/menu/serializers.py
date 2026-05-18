from rest_framework import serializers
from .models import Category, FoodItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


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
        )

    def validate(self, attrs):
        image = attrs.get('image')
        image_url = attrs.get('image_url', '')
        if image and image_url:
            raise serializers.ValidationError(
                {'image': 'Provide either an uploaded image or an image URL, not both.'}
            )
        return attrs

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
