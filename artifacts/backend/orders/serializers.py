from rest_framework import serializers
from .models import Order, OrderItem
from menu.models import FoodItem, RestaurantConfig
from menu.serializers import FoodItemSerializer
from .email_service import send_order_notification_to_admin
from decimal import Decimal

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

    class Meta:
        model = Order
        fields = (
            'id', 'user', 'status', 'total_price', 'packing_charge', 'gst_amount', 'delivery_charge',
            'created_at', 'address', 'items',
            'payment_method', 'payment_status', 'payment_provider', 'payment_reference',
            'paid_at',
        )
        read_only_fields = (
            'user', 'total_price', 'packing_charge', 'gst_amount', 'delivery_charge',
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
        
        # Explicitly remove read-only/managed fields from validated_data
        for field in ['payment_status', 'payment_provider', 'payment_reference', 'paid_at']:
            validated_data.pop(field, None)
            
        user = self.context['request'].user

        # Get restaurant config for charges
        config = RestaurantConfig.objects.first()
        packing_charge = config.packing_charge if config else Decimal('20.00')
        gst_percent = config.gst_percentage if config else Decimal('5.00')
        delivery_charge = Decimal('0.00')

        # Calculate subtotal
        subtotal = Decimal('0.00')
        for item_data in items_data:
            subtotal += item_data['food_item'].price * item_data['quantity']
        
        # Calculate GST on subtotal
        gst_amount = (subtotal * gst_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_price = subtotal + packing_charge + gst_amount + delivery_charge

        order = Order.objects.create(
            user=user, 
            total_price=total_price, 
            packing_charge=packing_charge,
            gst_amount=gst_amount,
            delivery_charge=delivery_charge,
            payment_method=payment_method,
            payment_status='unpaid',
            status='pending',
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

        # Trigger admin notification
        send_order_notification_to_admin(order)

        return order
