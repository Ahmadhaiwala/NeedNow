from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
import jwt
import json
from datetime import datetime, timedelta

from .models import User
from .serializers import UserSerializer, NeonAuthUserSerializer
from .neon_auth import get_neon_auth_user


def get_user_from_neon_auth(request):
    """
    Extract user from Neon Auth JWT token in Authorization header
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    
    # Validate token with Neon Auth
    user_data = get_neon_auth_user(token)
    if not user_data:
        return None
    
    # Get or create user from token data
    try:
        # Try to find user by Neon Auth ID or email
        neon_auth_id = user_data.get('sub') or user_data.get('id')
        email = user_data.get('email')
        
        if not email:
            print("No email in token")
            return None
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'neon_auth_id': neon_auth_id,
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
                'username': user_data.get('preferred_username', ''),
                'profile_image_url': user_data.get('picture', ''),
                'provider': user_data.get('provider', 'neon-auth'),
            }
        )
        
        # Update user data if not created
        if not created:
            user.neon_auth_id = neon_auth_id
            user.first_name = user_data.get('given_name', user.first_name)
            user.last_name = user_data.get('family_name', user.last_name)
            user.username = user_data.get('preferred_username', user.username)
            user.profile_image_url = user_data.get('picture', user.profile_image_url)
            user.provider = user_data.get('provider', user.provider)
            user.save()
        
        return user
        
    except Exception as e:
        print(f"Error getting user from Neon Auth: {e}")
        return None


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile
    """
    serializer_class = UserSerializer
    
    def get_object(self):
        return get_user_from_neon_auth(self.request)
    
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


@api_view(['GET'])
def user_info(request):
    """
    Get current user info from Neon Auth JWT token
    """
    user = get_user_from_neon_auth(request)
    
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


@api_view(['GET'])
def me(request):
    """
    Get current user for frontend auth check
    """
    user = get_user_from_neon_auth(request)
    
    if not user:
        return Response(
            {'error': 'Not authenticated'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    return Response(UserSerializer(user).data)


@api_view(['POST'])
def sync_neon_user(request):
    """
    Manually sync user data from Neon Auth token
    Useful for testing or ensuring user data is up to date
    """
    user = get_user_from_neon_auth(request)
    
    if not user:
        return Response(
            {'error': 'User not authenticated or not found'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    return Response({
        'message': f'User {user.display_name} synced successfully',
        'user': UserSerializer(user).data
    })