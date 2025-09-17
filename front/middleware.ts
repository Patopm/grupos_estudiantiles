import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from localStorage (we can't access it directly in middleware)
  // For now, we'll let the client-side AuthContext handle the protection
  // This middleware can be enhanced later for server-side route protection

  // Redirect root to landing page if not authenticated
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/student', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
