import { NextRequest, NextResponse } from 'next/server';

// Handle Neon Auth OAuth callback
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  
  // Get the search params from the callback
  const searchParams = url.searchParams;
  
  // Forward all params to the frontend
  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    params.append(key, value);
  }
  
  // Redirect back to home with the auth params
  const redirectUrl = new URL('/', url.origin);
  redirectUrl.search = params.toString();
  
  return NextResponse.redirect(redirectUrl);
}