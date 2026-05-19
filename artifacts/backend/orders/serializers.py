from rest_framework import serializers
from .models import Order, OrderItem
from .payments import apply_static_payment
from menu.models import FoodItem, RestaurantConfig
from menu.serializers import FoodItemSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    food_item = serializers.PrimaryKeyRelatedField(queryset=FoodItem.objects.all())

    class Meta:
        model = OrderItem
        fields = ('id', 'food_item', 'quantity', 'price')
        read_only_fields = ('price',)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['food_item'] = FoodItemSerializer(instance.food_item).data
        return data

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    user = serializers.SerializerMethodField()
    payment_method = serializers.ChoiceField(
        choices=[c[0] for c in Order.PAYMENT_METHOD],
        default='cod',
    )
    card_number = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'user', 'status', 'total_price', 'packing_charge', 'delivery_charge',
            'created_at', 'address', 'items',
            'payment_method', 'payment_status', 'payment_provider', 'payment_reference',
            'paid_at', 'card_number',
        )
        read_only_fields = (
            'user', 'total_price', 'packing_charge', 'delivery_charge',
            'status', 'payment_status', 'payment_provider',
            'payment_reference', 'paid_at',
        )

    def get_user(self, obj):
        return {
            'id': obj.user_id,
            'username': obj.user.username,
            'email': obj.user.email,
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        payment_method = validated_data.pop('payment_method', 'cod')
        card_number = validated_data.pop('card_number', '')
        validated_data.pop('payment_status', None)
        validated_data.pop('payment_provider', None)
        validated_data.pop('payment_reference', None)
        validated_data.pop('paid_at', None)
        user = self.context['request'].user

        # Get restaurant config for charges
        config = RestaurantConfig.objects.first()
        packing_charge = config.packing_charge if config else 20.00
        delivery_charge = 0.00 # Default for now, can be updated later

        subtotal = sum(
            item_data['food_item'].price * item_data['quantity']
            for item_data in items_data
        )
        total_price = subtotal + packing_charge + delivery_charge

        order = Order.objects.create(
            user=user, 
            total_price=total_price, 
            packing_charge=packing_charge,
            delivery_charge=delivery_charge,
            **validated_data
        )

        for item_data in items_data:
            food_item = item_data['food_item']
            quantity = item_data['quantity']
            price = food_item.price * quantity
            OrderItem.objects.create(
                order=order,
                food_item=food_item,
                quantity=quantity,
                price=price,
            )

        apply_static_payment(order, payment_method, card_number=card_number)
        order.save()
        return order
