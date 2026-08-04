'use client';

import React from 'react';
import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

// The Neon Auth base URL includes the database path: /neondb/auth
// Better Auth's getBaseURL/withPath preserves the path when it's already present.
const authUrl = process.env.NEXT_PUBLIC_NEON_AUTH_BASE_URL!;

export const authClient = createAuthClient(authUrl, {
  adapter: BetterAuthReactAdapter(),
});

// Custom hook that wraps Neon Auth for our app
export function useAuth() {
  const { data: session, isPending: isLoading, error } = authClient.useSession();
  
  const syncUserWithBackend = React.useCallback(async (user: { id: string; email: string; name: string; image?: string | null }) => {
    if (!user?.email) {
      console.error('No user email available for sync');
      return;
    }

    try {
      // Get JWT from session token directly
      const sessionData = await authClient.getSession();
      const jwtToken = sessionData?.data?.session?.token;
      
      if (!jwtToken) {
        console.error('No JWT token available for sync');
        return;
      }

      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, jwtToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to sync user with backend:', response.status, errorData);
      } else {
        console.log('User synced with backend successfully');
      }
    } catch (error) {
      console.error('User sync error:', error);
    }
  }, []);
  
  // Auto-sync user with backend when session is available
  React.useEffect(() => {
    if (session?.user && !isLoading) {
      syncUserWithBackend(session.user);
    }
  }, [session?.user, isLoading, syncUserWithBackend]);

  // Handle auth errors
  React.useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
    }
  }, [error]);
  
  return {
    user: session?.user || null,
    isLoading,
    error,
    signOut: React.useCallback(async () => {
      try {
        await authClient.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }, []),
    signInWithGoogle: React.useCallback(async () => {
      try {
        await authClient.signIn.social({
          provider: 'google',
          callbackURL: '/api/auth/callback',
        });
      } catch (error) {
        console.error('Google sign in error:', error);
      }
    }, []),
    signInWithEmail: React.useCallback(async (email: string, password: string) => {
      try {
        await authClient.signIn.email({
          email,
          password,
        });
      } catch (error) {
        console.error('Email sign in error:', error);
      }
    }, []),
    signUpWithEmail: React.useCallback(async (email: string, password: string, name: string) => {
      try {
        await authClient.signUp.email({
          email,
          password,
          name,
        });
      } catch (error) {
        console.error('Email sign up error:', error);
      }
    }, []),
    getJWTToken: React.useCallback(async () => {
      try {
        const sessionData = await authClient.getSession();
        return sessionData?.data?.session?.token ?? null;
      } catch (error) {
        console.error('Get JWT token error:', error);
        return null;
      }
    }, [])
  };
}

// Auth Button Components for easy integration
export function SignInButton({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}) {
  const { signInWithGoogle } = useAuth();
  
  const handleClick = React.useCallback(async () => {
    if (onClick) {
      onClick();
    } else {
      await signInWithGoogle();
    }
  }, [onClick, signInWithGoogle]);
  
  return (
    <button 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </button>
  );
}

export function SignOutButton({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}) {
  const { signOut } = useAuth();
  
  const handleClick = React.useCallback(async () => {
    if (onClick) {
      onClick();
    } else {
      await signOut();
    }
  }, [onClick, signOut]);
  
  return (
    <button 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </button>
  );
}

// Export auth client for direct use if needed
export { authClient as neonAuth };
