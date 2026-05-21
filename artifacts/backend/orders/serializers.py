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
            'created_at', 'address', 'phone', 'items', 'device_id',
            'payment_method', 'payment_status', 'payment_provider', 'payment_reference',
            'paid_at',
        )
        read_only_fields = (
            'user', 'total_price', 'packing_charge', 'gst_amount', 'delivery_charge',
            'status', 'payment_status', 'payment_provider',
            'payment_reference', 'paid_at',
        )

    def get_user(self, obj):
        if obj.user:
            return {
                'id': obj.user_id,
                'username': obj.user.username,
                'email': obj.user.email,
            }
        return None

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        payment_method = validated_data.pop('payment_method', 'cod')
        
        # Explicitly remove read-only/managed fields from validated_data
        for field in ['payment_status', 'payment_provider', 'payment_reference', 'paid_at']:
            validated_data.pop(field, None)
            
        request_user = self.context['request'].user
        user = request_user if request_user.is_authenticated else None
        is_guest = not request_user.is_authenticated

        # Get restaurant config for charges and timing
        config = RestaurantConfig.objects.first()
        packing_charge = config.packing_charge if config else Decimal('20.00')
        gst_percent = config.gst_percentage if config else Decimal('5.00')
        delivery_charge = Decimal('0.00')

        # Check Restaurant Timing
        from django.utils import timezone
        import datetime
        
        now = timezone.localtime()
        current_day = now.strftime('%a') # Mon, Tue, etc.
        current_time = now.time()
        
        is_open = True
        if config:
            # Default timing
            opening = config.opening_time
            closing = config.closing_time
            
            # Check weekday specific timing
            if config.weekday_timing and current_day in config.weekday_timing:
                day_timing = config.weekday_timing[current_day]
                if 'open' in day_timing and 'close' in day_timing:
                    try:
                        opening = datetime.datetime.strptime(day_timing['open'], '%H:%M').time()
                        closing = datetime.datetime.strptime(day_timing['close'], '%H:%M').time()
                    except ValueError:
                        pass
            
            if not (opening <= current_time <= closing):
                is_open = False
        
        if not is_open:
            raise serializers.ValidationError("The restaurant is currently closed.")

        # Calculate subtotal and check stock
        subtotal = Decimal('0.00')
        for item_data in items_data:
            food_item = item_data['food_item']
            quantity = item_data['quantity']
            
            if not food_item.is_available or food_item.current_stock < quantity:
                raise serializers.ValidationError(f"Item '{food_item.name}' is out of stock or unavailable.")
                
            subtotal += food_item.price * quantity
        
        # Calculate GST on subtotal
        gst_amount = (subtotal * gst_percent / Decimal('100')).quantize(Decimal('0.01'))
        total_price = subtotal + packing_charge + gst_amount + delivery_charge

        order = Order.objects.create(
            user=user,
            is_guest=is_guest,
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
            
            # Decrement stock
            food_item.current_stock -= quantity
            if food_item.current_stock == 0:
                # Optionally send email if stock hits 0
                from orders.email_service import send_stock_alert_to_admin
                send_stock_alert_to_admin(food_item)
            food_item.save()

        # Trigger admin notification
        send_order_notification_to_admin(order)

        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if items_data is not None:
            # Clear existing items and recreate
            instance.items.all().delete()
            
            # Get restaurant config for charges
            config = RestaurantConfig.objects.first()
            packing_charge = config.packing_charge if config else Decimal('20.00')
            gst_percent = config.gst_percentage if config else Decimal('5.00')
            delivery_charge = instance.delivery_charge

            subtotal = Decimal('0.00')
            for item_data in items_data:
                food_item = item_data['food_item']
                quantity = item_data['quantity']
                price = food_item.price * quantity
                
                OrderItem.objects.create(
                    order=instance,
                    food_item=food_item,
                    quantity=quantity,
                    price=price,
                )
                subtotal += price
            
            # Recalculate totals
            gst_amount = (subtotal * gst_percent / Decimal('100')).quantize(Decimal('0.01'))
            instance.gst_amount = gst_amount
            instance.packing_charge = packing_charge
            instance.total_price = subtotal + packing_charge + gst_amount + delivery_charge

        instance.save()
        return instance
