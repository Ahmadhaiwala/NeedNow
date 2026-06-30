import { NextRequest, NextResponse } from 'next/server';

// API route to sync user data with Django backend
export async function POST(request: NextRequest) {
  try {
    const { user, jwtToken } = await request.json();
    
    if (!user || !jwtToken) {
      return NextResponse.json({ error: 'Missing user data or JWT token' }, { status: 400 });
    }
    
    // Call your Django backend to create or update user
    const backendUrl = 'http://localhost:8000';
    
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
      console.error('Backend sync failed:', response.status);
      return NextResponse.json({ error: 'Backend sync failed' }, { status: 500 });
    }
    
    const userData = await response.json();
    return NextResponse.json({ success: true, user: userData });
    
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}