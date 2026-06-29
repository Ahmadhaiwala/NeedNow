from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - handles Clerk integration
    """
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'username',
            'profile_image_url', 'is_active', 'created_at',
            'full_name', 'display_name'
        ]
        read_only_fields = ['id', 'created_at', 'full_name', 'display_name']


class ClerkWebhookUserSerializer(serializers.Serializer):
    """
    Serializer for handling Clerk webhook user data
    """
    id = serializers.CharField()
    email_addresses = serializers.ListField(
        child=serializers.DictField()
    )
    first_name = serializers.CharField(allow_blank=True, required=False)
    last_name = serializers.CharField(allow_blank=True, required=False)
    username = serializers.CharField(allow_blank=True, required=False)
    image_url = serializers.URLField(allow_blank=True, required=False)
    
    def create_or_update_user(self):
        """
        Create or update user from Clerk webhook data
        """
        data = self.validated_data
        
        # Extract primary email
        primary_email = None
        for email_obj in data.get('email_addresses', []):
            if email_obj.get('id') == data.get('primary_email_address_id'):
                primary_email = email_obj.get('email_address')
                break
        
        if not primary_email and data.get('email_addresses'):
            primary_email = data['email_addresses'][0].get('email_address')
        
        # Create or update user
        user, created = User.objects.update_or_create(
            id=data['id'],
            defaults={
                'email': primary_email or '',
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'username': data.get('username', ''),
                'profile_image_url': data.get('image_url', ''),
            }
        )
        
        return user, created