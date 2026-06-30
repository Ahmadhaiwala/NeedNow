"""
Neon Auth JWT validation utilities
"""
import jwt
import requests
from django.conf import settings
from django.core.cache import cache
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.serialization import load_pem_public_key
import json

class NeonAuthValidator:
    """Validates Neon Auth JWT tokens"""
    
    def __init__(self):
        self.jwks_url = settings.NEON_AUTH_JWKS_URL
        self.base_url = settings.NEON_AUTH_BASE_URL
    
    def get_jwks(self):
        """Fetch JWKS from Neon Auth server with caching"""
        cache_key = "neon_auth_jwks"
        jwks = cache.get(cache_key)
        
        if not jwks:
            try:
                response = requests.get(self.jwks_url, timeout=10)
                response.raise_for_status()
                jwks = response.json()
                # Cache for 1 hour
                cache.set(cache_key, jwks, 3600)
            except Exception as e:
                print(f"Failed to fetch JWKS: {e}")
                return None
        
        return jwks
    
    def get_public_key(self, kid):
        """Get public key from JWKS by key ID"""
        jwks = self.get_jwks()
        if not jwks:
            return None
            
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                # Convert JWK to PEM format
                try:
                    # For RSA keys
                    if key.get("kty") == "RSA":
                        from jwt.algorithms import RSAAlgorithm
                        return RSAAlgorithm.from_jwk(json.dumps(key))
                    # For EC keys  
                    elif key.get("kty") == "EC":
                        from jwt.algorithms import ECAlgorithm
                        return ECAlgorithm.from_jwk(json.dumps(key))
                    # For OKP keys (Ed25519/EdDSA) - used by Neon Auth
                    elif key.get("kty") == "OKP":
                        from jwt.algorithms import OKPAlgorithm
                        return OKPAlgorithm.from_jwk(json.dumps(key))
                except Exception as e:
                    print(f"Error converting JWK to public key: {e}")
                    return None
        
        return None
    
    def validate_token(self, token):
        """
        Validate Neon Auth JWT token
        Returns user data if valid, None if invalid
        """
        try:
            # Decode header to get key ID
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            
            if not kid:
                print("No kid in JWT header")
                return None
            
            # Get public key for this kid
            public_key = self.get_public_key(kid)
            if not public_key:
                print(f"No public key found for kid: {kid}")
                return None
            
            # Verify and decode token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["EdDSA"],  # Common algorithms
                audience=self.base_url,
                options={"verify_exp": True, "verify_aud": False}  # Make audience optional for now
            )
            
            return payload
            
        except jwt.ExpiredSignatureError:
            print("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
        except Exception as e:
            print(f"Token validation error: {e}")
            return None

def get_neon_auth_user(token):
    """
    Get user data from Neon Auth token
    """
    validator = NeonAuthValidator()
    return validator.validate_token(token)