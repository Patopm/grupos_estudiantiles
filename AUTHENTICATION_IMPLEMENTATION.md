# Authentication Implementation Guide

## Overview

This document describes the complete authentication system implemented for the Grupos Estudiantiles platform, connecting the Next.js frontend with the Django REST Framework backend.

## ✅ Implemented Features

### Backend Integration

- **JWT Authentication** with access and refresh tokens
- **Role-based authentication** (Student, President, Admin)
- **Secure token storage** in localStorage
- **Automatic token refresh** when access token expires
- **API error handling** with user-friendly messages

### Frontend Components

- **AuthContext** for global authentication state management
- **Login page** with real backend integration
- **Register page** with validation and error handling
- **Protected routes** with role-based access control
- **Dashboard pages** for each user role (Student, President, Admin)

### Security Features

- **Token expiration handling** with automatic refresh
- **Secure logout** with token blacklisting
- **Input validation** using Zod schemas
- **CORS configuration** for frontend-backend communication

## 🏗️ Architecture

### Authentication Flow

1. **Registration**:

   - User fills registration form
   - Frontend validates data with Zod
   - POST request to `/api/auth/register/`
   - Success redirects to login with success message

2. **Login**:

   - User enters credentials
   - Frontend validates and sends to `/api/auth/login/`
   - Backend returns JWT tokens and user data
   - Tokens stored in localStorage
   - User redirected to role-based dashboard

3. **Protected Routes**:
   - `ProtectedRoute` component checks authentication
   - Automatic token refresh if expired
   - Role-based access control
   - Logout clears tokens and redirects

### File Structure

```txt
front/
├── lib/
│   └── auth.ts                 # Authentication service & token management
├── contexts/
│   └── AuthContext.tsx         # React context for auth state
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx      # Login page with backend integration
│   │   └── register/page.tsx   # Registration page
│   ├── dashboard/
│   │   ├── student/page.tsx    # Student dashboard
│   │   ├── president/page.tsx  # President dashboard
│   │   └── admin/page.tsx      # Admin dashboard
│   └── layout.tsx              # Root layout with AuthProvider
└── middleware.ts               # Next.js middleware for route handling
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### Backend API Endpoints

The implementation uses these backend endpoints:

- `POST /api/auth/login/` - User authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - Token invalidation
- `POST /api/auth/refresh/` - Token refresh
- `GET /api/auth/me/` - Current user info

## 🚀 Usage

### Using Authentication in Components

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.first_name}!</div>;
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from "@/contexts/AuthContext";

function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## 🔐 Security Considerations

### Token Management

- **Access tokens** expire in 60 minutes
- **Refresh tokens** expire in 7 days with rotation
- **Automatic cleanup** on logout
- **Secure storage** in localStorage (client-side only)

### Input Validation

- **Zod schemas** for form validation
- **Backend validation** for data integrity
- **Error handling** with user-friendly messages
- **CSRF protection** via Django middleware

### Role-Based Access

- **Route protection** by user role
- **Automatic redirects** based on permissions
- **Fallback handling** for unauthorized access

## 🐛 Error Handling

### Authentication Errors

- **Invalid credentials**: Clear error message
- **Expired tokens**: Automatic refresh attempt
- **Network errors**: Fallback error messages
- **Validation errors**: Field-specific feedback

### User Experience

- **Loading states** during authentication
- **Success messages** for registration
- **Error recovery** with retry options
- **Graceful degradation** on failures

## 📱 User Roles & Dashboards

### Student Dashboard

- View and join groups
- Participate in events
- Manage profile
- Access: `/dashboard/student`

### President Dashboard

- Manage group members
- Create and manage events
- Handle join requests
- Access: `/dashboard/president`

### Admin Dashboard

- Manage all users and groups
- System configuration
- Reports and analytics
- Access: `/dashboard/admin`

## 🔄 Token Refresh Flow

1. **Access token expires** during API call
2. **AuthContext detects** expiration
3. **Automatic refresh** using refresh token
4. **Update tokens** in localStorage
5. **Retry original** API request
6. **Logout user** if refresh fails

## 🚦 Development & Testing

### Running the System

1. **Start Backend**:

   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend**:

   ```bash
   cd front
   npm run dev
   ```

3. **Test Authentication**:
   - Visit `http://localhost:3000`
   - Click "Registrarse" to create account
   - Login with new credentials
   - Verify role-based dashboard access

### Test Credentials

Create test users via Django admin or API:

- **Student**: role='student'
- **President**: role='president'
- **Admin**: role='admin'

## 🔮 Future Enhancements

### Planned Features

- **Server-side middleware** for enhanced security
- **Password reset** functionality
- **Email verification** for registration
- **Social login** integration (Google, Facebook)
- **Two-factor authentication** (2FA)
- **Session management** improvements

### Security Improvements

- **HttpOnly cookies** for token storage
- **CSRF token** integration
- **Rate limiting** for auth endpoints
- **Audit logging** for security events

## 📚 Dependencies

### Frontend

- `next`: React framework
- `react`: UI library
- `zod`: Schema validation
- `@fortawesome/react-fontawesome`: Icons

### Backend

- `django`: Web framework
- `djangorestframework`: API framework
- `djangorestframework-simplejwt`: JWT authentication
- `django-cors-headers`: CORS handling

## 🤝 Contributing

When extending the authentication system:

1. **Maintain security** best practices
2. **Update documentation** for new features
3. **Add proper validation** for new endpoints
4. **Test thoroughly** across all user roles
5. **Follow existing** code patterns and styles

## 📞 Support

For issues or questions about the authentication implementation:

- Check the Django backend logs for API errors
- Verify environment variables are set correctly
- Ensure backend is running on correct port
- Check browser console for frontend errors
