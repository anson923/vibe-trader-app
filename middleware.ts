import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware function - lightweight version that doesn't initialize server
export async function middleware(request: NextRequest) {
  // Just continue with the request
  // Server initialization will happen in API routes instead
  return NextResponse.next();
}

// Only match API and page requests, not static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}; 