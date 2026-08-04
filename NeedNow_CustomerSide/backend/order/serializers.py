from rest_framework import serializers
from .models import Order, OrderItem, OrderCollaborator
from catalog.models import Product
from cart.models import Cart, CartItem
from decimal import Decimal


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.CharField(source='product.image', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_image',
            'quantity', 'unit_price', 'total_price', 'created_at'
        ]
        read_only_fields = ['total_price']


class OrderCollaboratorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = OrderCollaborator
        fields = [
            'id', 'user', 'user_name', 'user_email', 'role',
            'split_amount', 'split_type', 'payment_status', 'paid_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    collaborators = OrderCollaboratorSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'status', 'payment_status',
            'total_amount', 'currency', 'platform', 'external_order_id',
            'created_at', 'updated_at', 'items', 'collaborators'
        ]
        read_only_fields = ['user', 'total_amount']


class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.IntegerField(required=False)
    items = serializers.ListField(
        child=serializers.DictField(), 
        required=False,
        help_text="List of items: [{'product_id': 1, 'quantity': 2}, ...]"
    )
    platform = serializers.ChoiceField(
        choices=Order.Platform.choices,
        default=Order.Platform.NEEDNOW
    )
    
    def validate(self, data):
        if not data.get('cart_id') and not data.get('items'):
            raise serializers.ValidationError(
                "Either cart_id or items must be provided"
            )
        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        platform = validated_data.get('platform', Order.Platform.NEEDNOW)
        
        # Create order
        order = Order.objects.create(
            user=user,
            platform=platform,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.PENDING
        )
        
        total_amount = Decimal('0.00')
        
        if validated_data.get('cart_id'):
            # Create order from cart
            try:
                cart = Cart.objects.get(id=validated_data['cart_id'], user=user)
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        quantity=cart_item.quantity,
                        unit_price=cart_item.product.price,
                        added_by_user=user
                    )
                    total_amount += cart_item.product.price * cart_item.quantity
                
                # Clear cart after creating order
                cart.items.all().delete()
                
            except Cart.DoesNotExist:
                raise serializers.ValidationError("Cart not found")
        
        elif validated_data.get('items'):
            # Create order from items list
            for item_data in validated_data['items']:
                try:
                    product = Product.objects.get(id=item_data['product_id'])
                    quantity = item_data.get('quantity', 1)
                    
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.price,
                        added_by_user=user
                    )
                    total_amount += product.price * quantity
                    
                except Product.DoesNotExist:
                    order.delete()  # Cleanup on error
                    raise serializers.ValidationError(
                        f"Product with id {item_data['product_id']} not found"
                    )
        
        # Update order total
        order.total_amount = total_amount
        order.save()
        
        return order


class PaymentSimulationSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=[
            ('card', 'Credit/Debit Card'),
            ('upi', 'UPI'),
            ('netbanking', 'Net Banking'),
            ('wallet', 'Digital Wallet'),
            ('cod', 'Cash on Delivery')
        ]
    )
    simulate_failure = serializers.BooleanField(default=False)
    
    def validate_order_id(self, value):
        try:
            order = Order.objects.get(id=value)
            if order.payment_status == Order.PaymentStatus.PAID:
                raise serializers.ValidationError("Order is already paid")
            return value
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    
    def update(self, instance, validated_data):
        instance.status = validated_data['status']
        instance.save()
        return instance