'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';

export default function AuthTestPage() {
  const { user, isLoading, error, signInWithGoogle, signOut, getJWTToken } = useAuth();
  const [jwtToken, setJwtToken] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<string>('');

  const handleGetToken = async () => {
    try {
      const token = await getJWTToken();
      setJwtToken(token);
      console.log('JWT Token:', token);
    } catch (error) {
      console.error('Failed to get JWT token:', error);
      setTestResult('Failed to get JWT token: ' + error);
    }
  };

  const handleTestBackendSync = async () => {
    if (!jwtToken) {
      setTestResult('No JWT token available. Please get token first.');
      return;
    }

    try {
      const response = await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user: {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            image: user?.image
          }, 
          jwtToken 
        }),
      });
      
      const data = await response.json();
      setTestResult(`Backend sync response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setTestResult(`Backend sync error: ${error}`);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">
          <h3 className="font-bold">Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      <div className="space-y-4">
        {!user ? (
          <div>
            <p className="mb-4">Not signed in</p>
            <button 
              onClick={signInWithGoogle}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign In with Google
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-green-100 p-4 rounded mb-4">
              <h3 className="font-bold">Signed in as:</h3>
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
            
            <div className="space-x-4 mb-4">
              <button 
                onClick={handleGetToken}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Get JWT Token
              </button>
              
              <button 
                onClick={handleTestBackendSync}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={!jwtToken}
              >
                Test Backend Sync
              </button>
              
              <button 
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
            
            {jwtToken && (
              <div className="bg-gray-100 p-4 rounded mb-4">
                <h3 className="font-bold">JWT Token:</h3>
                <div className="text-xs break-all font-mono">{jwtToken}</div>
              </div>
            )}
            
            {testResult && (
              <div className="bg-yellow-100 p-4 rounded">
                <h3 className="font-bold">Test Result:</h3>
                <pre className="text-sm">{testResult}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}