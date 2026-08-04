from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from users.auth_utils import get_user_from_neon_auth
from catalog.models import Product
from order.models import Order, OrderItem
from order.serializers import OrderSerializer
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer


def _require_user(request):
    """Return (user, error_response). If error_response is not None, return it early."""
    user = get_user_from_neon_auth(request)
    print(f"DEBUG: user returned from get_user_from_neon_auth: {user}, type: {type(user)}")
    if not user:
        return None, Response(
            {'error': 'Authentication required. Please sign in.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return user, None


def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user, defaults={'is_active': True})
    return cart


@api_view(['GET'])
def cart_detail(request):
    """Get the current user's active cart with all items."""
    user, err = _require_user(request)
    if err:
        return err

    cart = _get_or_create_cart(user)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
def cart_add_item(request):
    """
    Add a product to the cart or increment its quantity.
    Body: { product_id: UUID, quantity: int (default 1) }
    """
    user, err = _require_user(request)
    if err:
        return err

    product_id = request.data.get('product_id')
    quantity = int(request.data.get('quantity', 1))

    if not product_id:
        return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    if quantity < 1:
        return Response({'error': 'quantity must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    cart = _get_or_create_cart(user)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )

    if not created:
        item.quantity += quantity
        item.save()

    serializer = CartSerializer(cart)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PATCH', 'DELETE'])
def cart_item_detail(request, item_id):
    """
    PATCH: Update quantity of a cart item. Body: { quantity: int }
    DELETE: Remove the item from cart.
    """
    user, err = _require_user(request)
    if err:
        return err

    cart = _get_or_create_cart(user)
    item = get_object_or_404(CartItem, id=item_id, cart=cart)

    if request.method == 'DELETE':
        item.delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    # PATCH — update quantity
    quantity = request.data.get('quantity')
    if quantity is None:
        return Response({'error': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)

    quantity = int(quantity)
    if quantity < 1:
        item.delete()
    else:
        item.quantity = quantity
        item.save()

    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['DELETE'])
def cart_clear(request):
    """Remove all items from the cart."""
    user, err = _require_user(request)
    if err:
        return err

    cart = _get_or_create_cart(user)
    cart.items.all().delete()

    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['POST'])
def proceed_to_checkout(request):
    """
    Convert cart items to an order and proceed to checkout.
    Body: { platform: str (optional, defaults to 'neednow') }
    """
    user, err = _require_user(request)
    if err:
        return err

    cart = _get_or_create_cart(user)
    
    # Check if cart has items
    if not cart.items.exists():
        return Response(
            {'error': 'Cart is empty. Add items before proceeding to checkout.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get platform from request, default to neednow
    platform = request.data.get('platform', Order.Platform.NEEDNOW)
    
    # Validate platform choice
    if platform not in [choice[0] for choice in Order.Platform.choices]:
        return Response(
            {'error': f'Invalid platform. Choose from: {[choice[0] for choice in Order.Platform.choices]}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            # Create new order
            order = Order.objects.create(
                user=user,
                platform=platform,
                status=Order.Status.PENDING,
                payment_status=Order.PaymentStatus.PENDING
            )
            
            total_amount = 0
            
            # Convert cart items to order items
            for cart_item in cart.items.all():
                # Verify product still exists and is available
                if not cart_item.product:
                    return Response(
                        {'error': f'One or more products in your cart are no longer available.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create order item
                order_item = OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.price,
                    added_by_user=user
                )
                
                total_amount += order_item.total_price
            
            # Update order total
            order.total_amount = total_amount
            order.save()
            
            # Clear the cart after successful order creation
            cart.items.all().delete()
            
            # Serialize the order for response
            order_serializer = OrderSerializer(order)
            
            return Response({
                'success': True,
                'message': 'Order created successfully. Proceed with payment.',
                'order': order_serializer.data
            }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {'error': f'Failed to create order: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
