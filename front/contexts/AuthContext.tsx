'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, TokenManager, User, AuthResponse } from '@/lib/auth';
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from '@/lib/validations/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (email: ForgotPasswordFormData) => Promise<void>;
  resetPassword: (
    token: string,
    uid: string,
    passwordData: ResetPasswordFormData
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const isAuthenticated = !!user && TokenManager.isAuthenticated();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = TokenManager.getUser();
        const accessToken = TokenManager.getAccessToken();
        const refreshToken = TokenManager.getRefreshToken();

        if (storedUser && accessToken && refreshToken) {
          // Check if access token is expired
          if (TokenManager.isTokenExpired(accessToken)) {
            try {
              // Try to refresh the token
              const refreshResponse =
                await authService.refreshToken(refreshToken);
              TokenManager.updateAccessToken(refreshResponse.access);

              // If refresh token was rotated, update it
              if (refreshResponse.refresh) {
                const updatedAuthData: AuthResponse = {
                  access: refreshResponse.access,
                  refresh: refreshResponse.refresh,
                  user: storedUser,
                };
                TokenManager.setTokens(updatedAuthData);
              }

              setUser(storedUser);
            } catch (error) {
              // Refresh failed, clear tokens and redirect to login
              console.error('Token refresh failed:', error);
              TokenManager.clearTokens();
              setUser(null);
            }
          } else {
            // Token is still valid
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        TokenManager.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginFormData): Promise<void> => {
    try {
      const response = await authService.login(credentials);

      // Store tokens and user data
      TokenManager.setTokens(response);
      setUser(response.user);

      // Check for redirect URL from middleware
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl) {
        // Validate that the redirect URL is safe (internal to our app)
        if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
          router.push(redirectUrl);
          return;
        }
      }

      // Default redirect based on user role
      redirectToDashboard(response.user.role);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const register = async (userData: RegisterFormData): Promise<void> => {
    try {
      const response = await authService.register(userData);

      // After successful registration, redirect to login
      router.push('/login?message=registration-success');
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = TokenManager.getRefreshToken();

      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state regardless of API call success
      TokenManager.clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const accessToken = TokenManager.getAccessToken();
      if (accessToken) {
        const updatedUser = await authService.getCurrentUser(accessToken);
        setUser(updatedUser);

        // Update stored user data
        const currentTokens = {
          access: accessToken,
          refresh: TokenManager.getRefreshToken() || '',
          user: updatedUser,
        };
        TokenManager.setTokens(currentTokens);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If user refresh fails, logout
      await logout();
    }
  };

  const requestPasswordReset = async (
    email: ForgotPasswordFormData
  ): Promise<void> => {
    try {
      await authService.requestPasswordReset(email);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const resetPassword = async (
    token: string,
    uid: string,
    passwordData: ResetPasswordFormData
  ): Promise<void> => {
    try {
      await authService.resetPassword(token, uid, passwordData);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const redirectToDashboard = (role: string): void => {
    // Redirect based on user role as specified in requirements
    switch (role) {
      case 'admin':
        router.push('/dashboard/admin');
        break;
      case 'president':
        router.push('/dashboard/president');
        break;
      case 'student':
      default:
        router.push('/dashboard/student');
        break;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    requestPasswordReset,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'president' | 'student')[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackPath);
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User doesn't have required role, redirect to their dashboard
        switch (user.role) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'president':
            router.push('/dashboard/president');
            break;
          case 'student':
          default:
            router.push('/dashboard/student');
            break;
        }
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router, fallbackPath]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
