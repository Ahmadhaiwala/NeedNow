from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # User Profile Management
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('info/', views.user_info, name='user-info'),
    
    # User Sync (for testing)
    path('sync/', views.sync_user, name='sync-user'),
    
    # Clerk Webhooks
    path('webhooks/clerk/', views.ClerkWebhookView.as_view(), name='clerk-webhook'),
]