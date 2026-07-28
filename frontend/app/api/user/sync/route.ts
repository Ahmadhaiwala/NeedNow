import { NextRequest, NextResponse } from 'next/server';

// API route to sync user data with Django backend
export async function POST(request: NextRequest) {
  try {
    const { user, jwtToken } = await request.json();
    
    if (!user || !jwtToken) {
      return NextResponse.json({ error: 'Missing user data or JWT token' }, { status: 400 });
    }
    
    // Call your Django backend to create or update user
    // Use 127.0.0.1 instead of localhost for Node.js server-side fetch compatibility
    const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    const backendUrl = rawBackendUrl.replace('localhost', '127.0.0.1');
    
    const response = await fetch(`${backendUrl}/api/users/sync/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({
        neon_auth_id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend sync failed:', response.status, errorData);
      return NextResponse.json(
        { error: 'Backend sync failed', status: response.status, details: errorData },
        { status: response.status }
      );
    }
    
    const userData = await response.json();
    return NextResponse.json({ success: true, user: userData });
    
  } catch (error: any) {
    console.error('User sync error in Next API route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}