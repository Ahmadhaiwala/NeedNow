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
  const { data: session, isPending: isLoading } = authClient.useSession();
  
  const syncUserWithBackend = React.useCallback(async (user: { id: string; email: string; name: string; image?: string | null }) => {
    try {
      // Get JWT from session token directly
      const sessionData = await authClient.getSession();
      const jwtToken = sessionData?.data?.session?.token;
      
      if (!jwtToken) {
        console.error('No JWT token available');
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
        console.error('Failed to sync user with backend');
      } else {
        console.log('User synced with backend successfully');
      }
    } catch (error) {
      console.error('User sync error:', error);
    }
  }, []);
  
  // Auto-sync user with backend when session is available
  React.useEffect(() => {
    if (session?.user) {
      syncUserWithBackend(session.user);
    }
  }, [session, syncUserWithBackend]);
  
  return {
    user: session?.user || null,
    isLoading,
    signOut: async () => {
      await authClient.signOut();
    },
    signInWithGoogle: async () => {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/api/auth/callback',
      });
    },
    signInWithEmail: async (email: string, password: string) => {
      await authClient.signIn.email({
        email,
        password,
      });
    },
    signUpWithEmail: async (email: string, password: string, name: string) => {
      await authClient.signUp.email({
        email,
        password,
        name,
      });
    },
    getJWTToken: async () => {
      const sessionData = await authClient.getSession();
      return sessionData?.data?.session?.token ?? null;
    }
  };
}

// Auth Button Components for easy integration
export function SignInButton({ children, className, onClick }: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}) {
  const { signInWithGoogle } = useAuth();
  
  return (
    <button 
      onClick={onClick || signInWithGoogle} 
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
  
  return (
    <button 
      onClick={onClick || signOut} 
      className={className}
    >
      {children}
    </button>
  );
}

// Export auth client for direct use if needed
export { authClient as neonAuth };