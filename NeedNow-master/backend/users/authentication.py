from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .auth_utils import get_user_from_neon_auth


class NeonAuthAuthentication(BaseAuthentication):
    """
    Custom authentication class for Neon Auth JWT tokens
    """
    
    def authenticate(self, request):
        """
        Authenticate the request using Neon Auth JWT token
        Returns (user, token) if successful, None if not authenticated
        """
        try:
            user = get_user_from_neon_auth(request)
            if user:
                return (user, None)  # Return user and None for token (we don't need it)
            return None  # No authentication provided
            
        except Exception as e:
            # Don't raise an exception here, just return None
            # This allows other authentication classes to be tried
            print(f"Neon auth failed: {e}")
            return None
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response, or None if the
        authentication scheme should return 403 Permission Denied responses.
        """
        return 'Bearer'