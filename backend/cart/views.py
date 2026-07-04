from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from users.views import get_user_from_neon_auth
from catalog.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer


def _require_user(request):
    """Return (user, error_response). If error_response is not None, return it early."""
    user = get_user_from_neon_auth(request)
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
