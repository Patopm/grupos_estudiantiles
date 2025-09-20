# Middleware Testing Guide

This document provides manual testing steps to verify the enhanced middleware functionality.

## Test Scenarios

### 1. Unauthenticated User Access

**Test Case**: Unauthenticated user tries to access protected routes

- Visit `/dashboard` → Should redirect to `/login`
- Visit `/dashboard/admin` → Should redirect to `/login?redirect=/dashboard/admin`
- Visit `/dashboard/student` → Should redirect to `/login?redirect=/dashboard/student`
- Visit `/profile` → Should redirect to `/login?redirect=/profile`
- Visit `/settings` → Should redirect to `/login?redirect=/settings`

**Expected Behavior**: All protected routes should redirect to login with the attempted URL as a redirect parameter.

### 2. Authenticated User - Correct Role Access

**Test Case**: User with correct role accesses their routes

- Admin user visits `/dashboard/admin` → Should allow access
- President user visits `/dashboard/president` → Should allow access
- Student user visits `/dashboard/student` → Should allow access
- Any authenticated user visits `/profile`, `/settings`, `/notifications` → Should allow access

**Expected Behavior**: Users should be able to access routes they have permission for.

### 3. Authenticated User - Incorrect Role Access

**Test Case**: User tries to access routes they don't have permission for

- Student user visits `/dashboard/admin` → Should redirect to `/dashboard/student`
- Student user visits `/dashboard/president` → Should redirect to `/dashboard/student`
- President user visits `/dashboard/admin` → Should redirect to `/dashboard/president`

**Expected Behavior**: Users should be redirected to their appropriate dashboard when accessing unauthorized routes.

### 4. Auth Routes with Authenticated User

**Test Case**: Already authenticated user visits auth pages

- Authenticated user visits `/login` → Should redirect to their dashboard
- Authenticated user visits `/register` → Should redirect to their dashboard
- Authenticated user visits `/auth/login` → Should redirect to their dashboard

**Expected Behavior**: Authenticated users should not see auth pages and be redirected to their dashboard.

### 5. Public Routes

**Test Case**: Any user (authenticated or not) accesses public routes

- Visit `/` → Should allow access
- Visit `/about` → Should allow access (if exists)
- Visit `/contact` → Should allow access (if exists)

**Expected Behavior**: Public routes should be accessible to everyone.

### 6. Token Expiration

**Test Case**: User with expired token tries to access protected routes

- User with expired access token visits `/dashboard` → Should redirect to `/login`
- User with invalid token visits protected route → Should redirect to `/login`

**Expected Behavior**: Expired or invalid tokens should be treated as unauthenticated.

### 7. Redirect After Login

**Test Case**: User logs in after being redirected from protected route

- Visit `/dashboard/admin` while unauthenticated → Redirected to `/login?redirect=/dashboard/admin`
- Login successfully → Should redirect to `/dashboard/admin` (if user has admin role)
- Login successfully → Should redirect to user's dashboard (if user doesn't have admin role)

**Expected Behavior**: After successful login, users should be redirected to the originally requested URL if they have permission, otherwise to their appropriate dashboard.

## How to Test

1. **Setup**: Ensure the middleware is properly configured and the application is running
2. **Clear Storage**: Clear localStorage and cookies to start with unauthenticated state
3. **Test Each Scenario**: Go through each test case systematically
4. **Check Network Tab**: Verify redirects are happening at the server level (status 307/308)
5. **Check Console**: Look for any errors or unexpected behavior

## Expected Middleware Behavior

- ✅ Server-side route protection (redirects happen before page loads)
- ✅ Role-based access control
- ✅ Proper redirect handling with query parameters
- ✅ Token validation using cookies
- ✅ Seamless integration with existing AuthContext
- ✅ No impact on API routes or static files

## Troubleshooting

If tests fail:

1. Check browser developer tools for redirect chains
2. Verify cookies are being set correctly (access_token, refresh_token, user_data)
3. Check middleware console logs (if any)
4. Ensure TokenManager is setting cookies properly
5. Verify user role data is correct in cookies
