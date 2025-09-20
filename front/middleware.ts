import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  isTokenExpired,
  isProtectedRoute,
  getRequiredRoles,
  getDashboardUrl,
  type User,
} from './lib/middleware-utils';

/**
 * Get user data from cookies
 */
function getUserFromCookies(request: NextRequest): User | null {
  try {
    const userCookie = request.cookies.get('user_data');
    if (!userCookie) return null;

    return JSON.parse(decodeURIComponent(userCookie.value));
  } catch {
    return null;
  }
}

/**
 * Get access token from cookies
 */
function getAccessTokenFromCookies(request: NextRequest): string | null {
  const tokenCookie = request.cookies.get('access_token');
  return tokenCookie?.value || null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get authentication data from cookies
  const accessToken = getAccessTokenFromCookies(request);
  const user = getUserFromCookies(request);

  // Validate token if present
  const isAuthenticated = accessToken && !isTokenExpired(accessToken) && user;

  // Handle auth routes (login, register)
  if (AUTH_ROUTES.includes(pathname)) {
    if (isAuthenticated && user) {
      // User is already authenticated, redirect to their dashboard
      const dashboardUrl = getDashboardUrl(user.role);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
    // Allow access to auth routes for unauthenticated users
    return NextResponse.next();
  }

  // Handle public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Handle root dashboard redirect
  if (pathname === '/dashboard') {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Redirect to role-specific dashboard
    const dashboardUrl = getDashboardUrl(user!.role);
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store the attempted URL for redirect after login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const requiredRoles = getRequiredRoles(pathname);
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      // User doesn't have required role, redirect to their appropriate dashboard
      const dashboardUrl = getDashboardUrl(user.role);
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }

    // User is authenticated and has required role
    return NextResponse.next();
  }

  // For any other routes, allow access
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
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
