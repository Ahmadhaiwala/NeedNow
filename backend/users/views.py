from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import hmac
import hashlib
import os
import jwt
from django.conf import settings

from .models import User
from .serializers import UserSerializer, ClerkWebhookUserSerializer


def get_user_from_request(request):
    """
    Extract user from Clerk JWT token in Authorization header
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        # In production, you'd verify the JWT with Clerk's public key
        # For now, we'll decode without verification for development
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')  # Clerk user ID is in 'sub' claim
        
        if user_id:
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                return None
    except jwt.InvalidTokenError:
        return None
    
    return None


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile
    """
    serializer_class = UserSerializer
    
    def get_object(self):
        return get_user_from_request(self.request)
    
    def retrieve(self, request, *args, **kwargs):
        user = self.get_object()
        if not user:
            return Response(
                {'error': 'User not authenticated or not found'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)
    
    def update(self, request, *args, **kwargs):
        user = self.get_object()
        if not user:
            return Response(
                {'error': 'User not authenticated or not found'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class ClerkWebhookView(APIView):
    """
    Handle Clerk webhooks for user creation, update, and deletion
    This is how your backend stays in sync with Clerk
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        # Get the webhook secret from environment
        webhook_secret = os.environ.get('CLERK_WEBHOOK_SECRET', 'your-webhook-secret-here')
        
        # In production, verify the webhook signature here
        # For development, we'll skip verification
        
        # Process the webhook
        try:
            data = json.loads(request.body)
            event_type = data.get('type')
            user_data = data.get('data', {})
            
            print(f"📧 Clerk Webhook: {event_type}")  # Debug logging
            
            if event_type == 'user.created':
                return self._handle_user_created(user_data)
            elif event_type == 'user.updated':
                return self._handle_user_updated(user_data)
            elif event_type == 'user.deleted':
                return self._handle_user_deleted(user_data)
            else:
                print(f"⚠️ Unhandled webhook event: {event_type}")
                return Response({'message': f'Event {event_type} not handled'}, 
                              status=status.HTTP_200_OK)
                
        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"❌ Webhook error: {str(e)}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _handle_user_created(self, user_data):
        """Handle user creation from Clerk"""
        print(f"👤 Creating user: {user_data.get('id')}")
        
        serializer = ClerkWebhookUserSerializer(data=user_data)
        if serializer.is_valid():
            user, created = serializer.create_or_update_user()
            if created:
                print(f"✅ User created: {user.display_name}")
                return Response({'message': 'User created successfully'}, 
                              status=status.HTTP_201_CREATED)
            else:
                print(f"🔄 User updated: {user.display_name}")
                return Response({'message': 'User updated successfully'}, 
                              status=status.HTTP_200_OK)
        else:
            print(f"❌ Validation error: {serializer.errors}")
            return Response({'error': serializer.errors}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_user_updated(self, user_data):
        """Handle user update from Clerk"""
        print(f"🔄 Updating user: {user_data.get('id')}")
        
        serializer = ClerkWebhookUserSerializer(data=user_data)
        if serializer.is_valid():
            user, created = serializer.create_or_update_user()
            print(f"✅ User updated: {user.display_name}")
            return Response({'message': 'User updated successfully'}, 
                          status=status.HTTP_200_OK)
        else:
            return Response({'error': serializer.errors}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    def _handle_user_deleted(self, user_data):
        """Handle user deletion from Clerk"""
        user_id = user_data.get('id')
        print(f"🗑️ Deleting user: {user_id}")
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                user.is_active = False  # Soft delete
                user.save()
                print(f"✅ User deactivated: {user.display_name}")
                return Response({'message': 'User deactivated successfully'}, 
                              status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({'message': 'User not found'}, 
                              status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'User ID not provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def user_info(request):
    """
    Get current user info from JWT token
    This is how your frontend checks if user exists in backend
    """
    user = get_user_from_request(request)
    
    if not user:
        return Response(
            {'error': 'User not authenticated or not found'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    serializer = UserSerializer(user)
    return Response({
        'user': serializer.data,
        'message': f'Welcome {user.display_name}!'
    })


@api_view(['POST'])
def sync_user(request):
    """
    Manually sync user data from Clerk
    Useful for testing or if webhook fails
    """
    user_data = request.data
    
    if not user_data.get('id'):
        return Response(
            {'error': 'User ID required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = ClerkWebhookUserSerializer(data=user_data)
    if serializer.is_valid():
        user, created = serializer.create_or_update_user()
        action = 'created' if created else 'updated'
        
        return Response({
            'message': f'User {action} successfully',
            'user': UserSerializer(user).data
        })
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)