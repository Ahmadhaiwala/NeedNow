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
from .auth_utils import get_user_from_neon_auth


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
    Sync user data from Neon Auth token or request body
    """
    user = get_user_from_neon_auth(request)
    
    if not user and request.data:
        data = request.data
        email = data.get('email')
        neon_auth_id = data.get('neon_auth_id')
        name = data.get('name', '')
        image = data.get('image', '')
        
        if email:
            try:
                name_parts = name.strip().split(' ') if name else []
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
                
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'neon_auth_id': neon_auth_id,
                        'first_name': first_name,
                        'last_name': last_name,
                        'profile_image_url': image or '',
                        'provider': 'neon-auth',
                    }
                )
                if not created:
                    if neon_auth_id:
                        user.neon_auth_id = neon_auth_id
                    if first_name and not user.first_name:
                        user.first_name = first_name
                    if last_name and not user.last_name:
                        user.last_name = last_name
                    if image and not user.profile_image_url:
                        user.profile_image_url = image
                    user.save()
            except Exception as e:
                print(f"Error syncing user from body data: {e}")
                import traceback
                traceback.print_exc()

    if not user:
        return Response(
            {'error': 'User not authenticated or not found'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    return Response({
        'message': f'User {user.display_name} synced successfully',
        'user': UserSerializer(user).data
    })