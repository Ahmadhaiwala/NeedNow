# 🔐 Clerk Integration Guide for NeedNow

## Overview

This document explains how the NeedNow frontend (Next.js + Clerk) communicates with the Django backend through Clerk authentication.

## Architecture Flow

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
│                 │    │              │    │                  │
│   Frontend      │───▶│    Clerk     │───▶│   Django Backend │
│   (Next.js)     │    │   (Auth)     │    │   (REST API)     │
│                 │    │              │    │                  │
└─────────────────┘    └──────────────┘    └──────────────────┘
```

## Key Components

### 1. Frontend Authentication (Next.js + Clerk)

**Location**: `frontend/app/navbar/Navbar.tsx`

The frontend uses Clerk components:
- `SignInButton` - Opens sign-in modal
- `SignUpButton` - Opens sign-up modal  
- `UserButton` - Shows user profile dropdown
- `useUser()` - Hook to get current user info

### 2. Backend User Model (Django)

**Location**: `backend/users/models.py`

Simple User model that syncs with Clerk:
- `id` - Clerk User ID (primary key)
- `email` - User's email from Clerk
- `first_name`, `last_name` - User's name
- `username` - Optional username
- `profile_image_url` - Profile picture from Clerk
- `is_active` - Account status

### 3. Clerk Webhooks (Backend)

**Location**: `backend/users/views.py - ClerkWebhookView`

Clerk sends webhooks to keep backend in sync:
- `user.created` - When user signs up
- `user.updated` - When user updates profile
- `user.deleted` - When user deletes account

**Webhook URL**: `http://localhost:8000/api/users/webhooks/clerk/`

### 4. JWT Token Authentication

**Location**: `backend/users/views.py - get_user_from_request()`

Frontend sends JWT tokens in API requests:
```
Authorization: Bearer <clerk-jwt-token>
```

Backend extracts user ID from JWT and looks up user in database.

## API Endpoints

### User Profile
- **GET** `/api/users/profile/` - Get user profile
- **PUT** `/api/users/profile/` - Update user profile

### User Info
- **GET** `/api/users/info/` - Get current user info from JWT

### User Sync (Testing)
- **POST** `/api/users/sync/` - Manually sync user from Clerk

### Clerk Webhook
- **POST** `/api/users/webhooks/clerk/` - Handle Clerk webhooks

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Database Migrations

```bash
python manage.py makemigrations users
python manage.py migrate
```

### 3. Create Django Superuser

```bash
python manage.py createsuperuser
```

### 4. Start Django Development Server

```bash
python manage.py runserver
```

### 5. Configure Clerk Webhooks

In Clerk Dashboard:
1. Go to Webhooks section
2. Add endpoint: `http://localhost:8000/api/users/webhooks/clerk/`
3. Select events: `user.created`, `user.updated`, `user.deleted`

## How Frontend Talks to Backend

### 1. User Signs In (Frontend)
```javascript
// User clicks "Sign In" in Navbar
// Clerk handles authentication
// User is redirected back to app
```

### 2. Making API Calls (Frontend)
```javascript
// Get JWT token from Clerk
const token = await getToken();

// Make API call to backend
const response = await fetch('http://localhost:8000/api/users/info/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Backend Processes Request
```python
# Extract user from JWT token
user = get_user_from_request(request)

# Return user data
return Response({
    'user': UserSerializer(user).data,
    'message': f'Welcome {user.display_name}!'
})
```

## Testing the Integration

### 1. Test User Creation via Webhook
When a user signs up in the frontend, Clerk automatically sends a webhook to create the user in Django.

### 2. Test API Authentication
```bash
# Get JWT token from frontend (check browser DevTools)
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:8000/api/users/info/
```

### 3. Test Manual User Sync
```bash
curl -X POST http://localhost:8000/api/users/sync/ \
     -H "Content-Type: application/json" \
     -d '{
       "id": "user_123",
       "email_addresses": [{"email_address": "test@example.com"}],
       "first_name": "John",
       "last_name": "Doe"
     }'
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### Backend (Django settings or .env)
```
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
```

## Next Steps

1. ✅ **Basic User Model** - Simple Clerk integration
2. 🔄 **Test Webhook Integration** - Verify user sync works
3. 📝 **Frontend API Calls** - Connect Next.js to Django
4. 🏠 **Inventory System** - Add shopping/inventory features
5. 🤖 **AI Integration** - Add the core AI shopping engine

## Important Notes

- Keep this implementation simple for now
- Focus on understanding the Clerk ↔ Django flow
- User preferences and complex features come later
- Priority is getting basic authentication working end-to-end