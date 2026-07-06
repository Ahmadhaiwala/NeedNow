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