from django.shortcuts import render

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Order, OrderItem, OrderCollaborator
from .serializers import (
    OrderSerializer, CreateOrderSerializer, PaymentSimulationSerializer,
    OrderStatusUpdateSerializer, OrderItemSerializer
)
import random
import time


class OrderListCreateView(generics.ListCreateAPIView):
    """List user's orders or create new order"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateOrderSerializer
        return OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save()


class OrderDetailView(generics.RetrieveUpdateAPIView):
    """Get, update order details"""
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return OrderStatusUpdateSerializer
        return OrderSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_payment(request):
    """Simulate payment processing with random success/failure"""
    serializer = PaymentSimulationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    order = get_object_or_404(Order, id=data['order_id'])
    
    # Check if user owns the order
    if order.user != request.user:
        return Response(
            {'error': 'Not authorized to pay for this order'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Simulate payment processing delay
    time.sleep(2)
    
    # Determine if payment should fail (10% chance or if explicitly requested)
    should_fail = data.get('simulate_failure', False) or random.random() < 0.1
    
    if should_fail:
        order.payment_status = Order.PaymentStatus.FAILED
        order.save()
        
        return Response({
            'success': False,
            'message': 'Payment failed. Please try again.',
            'order_id': order.id,
            'payment_status': order.payment_status
        }, status=status.HTTP_400_BAD_REQUEST)
    
    else:
        # Payment successful
        order.payment_status = Order.PaymentStatus.PAID
        order.status = Order.Status.PLACED
        order.save()
        
        # Generate mock transaction ID
        transaction_id = f"TXN_{order.id}_{int(timezone.now().timestamp())}"
        
        return Response({
            'success': True,
            'message': 'Payment successful!',
            'order_id': order.id,
            'transaction_id': transaction_id,
            'payment_status': order.payment_status,
            'order_status': order.status,
            'amount_paid': float(order.total_amount)
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_order(request, order_id):
    """Cancel an order"""
    order = get_object_or_404(Order, id=order_id, user=request.user)
    
    # Only allow cancellation if order is not shipped or delivered
    if order.status in [Order.Status.SHIPPED, Order.Status.DELIVERED]:
        return Response(
            {'error': 'Cannot cancel order that is already shipped or delivered'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    order.status = Order.Status.CANCELLED
    
    # If payment was made, mark for refund
    if order.payment_status == Order.PaymentStatus.PAID:
        order.payment_status = Order.PaymentStatus.REFUNDED
    
    order.save()
    
    return Response({
        'message': 'Order cancelled successfully',
        'order_id': order.id,
        'status': order.status,
        'payment_status': order.payment_status
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_summary(request):
    """Get user's order summary/statistics"""
    user_orders = Order.objects.filter(user=request.user)
    
    summary = {
        'total_orders': user_orders.count(),
        'pending_orders': user_orders.filter(status=Order.Status.PENDING).count(),
        'completed_orders': user_orders.filter(status=Order.Status.DELIVERED).count(),
        'cancelled_orders': user_orders.filter(status=Order.Status.CANCELLED).count(),
        'total_spent': sum(
            order.total_amount for order in user_orders.filter(
                payment_status=Order.PaymentStatus.PAID
            )
        ),
        'recent_orders': OrderSerializer(
            user_orders.order_by('-created_at')[:5], many=True
        ).data
    }
    
    return Response(summary, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder(request, order_id):
    """Create a new order based on a previous order"""
    original_order = get_object_or_404(Order, id=order_id, user=request.user)
    
    # Create new order
    new_order = Order.objects.create(
        user=request.user,
        platform=original_order.platform,
        status=Order.Status.PENDING,
        payment_status=Order.PaymentStatus.PENDING
    )
    
    total_amount = 0
    
    # Copy items from original order
    for item in original_order.items.all():
        if item.product:  # Make sure product still exists
            OrderItem.objects.create(
                order=new_order,
                product=item.product,
                quantity=item.quantity,
                unit_price=item.product.price,  # Use current price
                added_by_user=request.user
            )
            total_amount += item.product.price * item.quantity
    
    new_order.total_amount = total_amount
    new_order.save()
    
    return Response(
        OrderSerializer(new_order).data, 
        status=status.HTTP_201_CREATED
    )
