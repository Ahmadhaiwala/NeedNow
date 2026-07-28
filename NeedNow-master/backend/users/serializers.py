from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - handles Neon Auth integration
    """
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'username',
            'profile_image_url', 'provider', 'is_active', 'created_at',
            'full_name', 'display_name', 'neon_auth_id'
        ]
        read_only_fields = ['id', 'created_at', 'full_name', 'display_name', 'neon_auth_id']


class NeonAuthUserSerializer(serializers.Serializer):
    """
    Serializer for handling Neon Auth user data
    """
    sub = serializers.CharField()  # Neon Auth user ID
    email = serializers.EmailField()
    given_name = serializers.CharField(allow_blank=True, required=False)
    family_name = serializers.CharField(allow_blank=True, required=False)
    preferred_username = serializers.CharField(allow_blank=True, required=False)
    picture = serializers.URLField(allow_blank=True, required=False)
    provider = serializers.CharField(allow_blank=True, required=False)
    
    def create_or_update_user(self):
        """
        Create or update user from Neon Auth data
        """
        data = self.validated_data
        
        user, created = User.objects.update_or_create(
            email=data['email'],
            defaults={
                'neon_auth_id': data['sub'],
                'first_name': data.get('given_name', ''),
                'last_name': data.get('family_name', ''),
                'username': data.get('preferred_username', ''),
                'profile_image_url': data.get('picture', ''),
                'provider': data.get('provider', 'neon-auth'),
            }
        )
        
        return user, created