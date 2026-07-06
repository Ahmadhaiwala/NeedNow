"""
Authentication utilities for Neon Auth integration
"""

from .models import User
from .neon_auth import get_neon_auth_user


def get_user_from_neon_auth(request):
    """
    Extract user from Neon Auth JWT token in Authorization header
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            print(f"Invalid auth header format: {auth_header}")
            return None
        
        token = auth_header.split(' ')[1]
        
        # Validate token with Neon Auth
        user_data = get_neon_auth_user(token)
        if not user_data:
            print("No user data returned from token validation")
            return None
        
        # Get or create user from token data
        try:
            # Try to find user by Neon Auth ID or email
            neon_auth_id = user_data.get('sub') or user_data.get('id')
            email = user_data.get('email')
            
            if not email:
                print(f"No email in token data: {user_data}")
                return None
            
            print(f"Creating/updating user with email: {email}, neon_auth_id: {neon_auth_id}")
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'neon_auth_id': neon_auth_id,
                    'first_name': user_data.get('given_name', ''),
                    'last_name': user_data.get('family_name', ''),
                    'username': user_data.get('preferred_username', '') if user_data.get('preferred_username') else None,
                    'profile_image_url': user_data.get('picture', ''),
                    'provider': user_data.get('provider', 'neon-auth'),
                }
            )
            
            # Update user data if not created
            if not created:
                print(f"Updating existing user: {user.email}")
                user.neon_auth_id = neon_auth_id
                user.first_name = user_data.get('given_name', user.first_name)
                user.last_name = user_data.get('family_name', user.last_name)
                user.username = user_data.get('preferred_username') if user_data.get('preferred_username') else user.username
                user.profile_image_url = user_data.get('picture', user.profile_image_url)
                user.provider = user_data.get('provider', user.provider)
                user.save()
            else:
                print(f"Created new user: {user.email}")
            
            return user
            
        except Exception as e:
            print(f"Database error getting user from Neon Auth: {e}")
            import traceback
            traceback.print_exc()
            return None
            
    except Exception as e:
        print(f"General error in get_user_from_neon_auth: {e}")
        import traceback
        traceback.print_exc()
        return None