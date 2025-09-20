/**
 * Utility functions for middleware route protection
 * These functions are extracted for testing purposes
 */

export interface TokenPayload {
  user_id: number;
  username: string;
  exp: number;
  iat: number;
  jti: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'president' | 'student';
  role_display: string;
  student_id: string;
  phone: string;
  is_active_student: boolean;
}

// Define protected routes and their required roles
export const PROTECTED_ROUTES = {
  '/dashboard': ['admin', 'president', 'student'],
  '/dashboard/admin': ['admin'],
  '/dashboard/president': ['president'],
  '/dashboard/student': ['student'],
  '/profile': ['admin', 'president', 'student'],
  '/profile/security': ['admin', 'president', 'student'],
  '/settings': ['admin', 'president', 'student'],
  '/notifications': ['admin', 'president', 'student'],
} as const;

// Auth routes that should redirect to dashboard if already authenticated
export const AUTH_ROUTES = [
  '/login',
  '/register',
  '/auth/login',
  '/auth/register',
];

// Public routes that don't require authentication
export const PUBLIC_ROUTES = ['/'];

/**
 * Decode JWT token payload
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  const currentTime = Date.now() / 1000;
  return payload.exp < currentTime;
}

/**
 * Check if route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return Object.keys(PROTECTED_ROUTES).some(
    route => pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Get required roles for a route
 */
export function getRequiredRoles(pathname: string): string[] | null {
  // Find the most specific matching route
  const matchingRoutes = Object.keys(PROTECTED_ROUTES)
    .filter(route => pathname === route || pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length); // Sort by length descending for most specific match

  if (matchingRoutes.length === 0) return null;

  return [
    ...PROTECTED_ROUTES[matchingRoutes[0] as keyof typeof PROTECTED_ROUTES],
  ];
}

/**
 * Get dashboard URL for user role
 */
export function getDashboardUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'president':
      return '/dashboard/president';
    case 'student':
    default:
      return '/dashboard/student';
  }
}

/**
 * Validate that a redirect URL is safe (internal to our app)
 */
export function isValidRedirectUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}
