'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  authService,
  TokenManager,
  User,
  AuthResponse,
  MFARequiredResponse,
} from '@/lib/auth';
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from '@/lib/validations/auth';
import {
  verificationApi,
  VerificationStatus,
  EmailVerificationRequest,
  EmailVerificationConfirm,
  PhoneVerificationRequest,
  PhoneVerificationConfirm,
  ResendVerificationRequest,
} from '@/lib/api/verification';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaUserId: string | null;
  verificationStatus: VerificationStatus | null;
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
  // MFA methods
  verifyMFA: (token: string) => Promise<void>;
  verifyBackupCode: (code: string) => Promise<void>;
  clearMFAState: () => void;
  // Verification methods
  getVerificationStatus: () => Promise<VerificationStatus>;
  requestEmailVerification: (data?: EmailVerificationRequest) => Promise<void>;
  confirmEmailVerification: (data: EmailVerificationConfirm) => Promise<void>;
  requestPhoneVerification: (data?: PhoneVerificationRequest) => Promise<void>;
  confirmPhoneVerification: (data: PhoneVerificationConfirm) => Promise<void>;
  resendVerification: (data: ResendVerificationRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProviderContent({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus | null>(null);
  const [pendingCredentials, setPendingCredentials] =
    useState<LoginFormData | null>(null);
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
            // Load verification status for authenticated user
            try {
              const status = await verificationApi.getStatus();
              setVerificationStatus(status);
            } catch (error) {
              console.error('Failed to load verification status:', error);
            }
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

      // Check if MFA is required
      if ('mfa_required' in response && response.mfa_required) {
        const mfaResponse = response as MFARequiredResponse;
        setMfaRequired(true);
        setMfaUserId(mfaResponse.user_id);
        setPendingCredentials(credentials); // Store credentials for MFA retry
        return; // Don't redirect, stay on login page for MFA input
      }

      // Normal login flow - store tokens and user data
      const authResponse = response as AuthResponse;
      TokenManager.setTokens(authResponse);
      setUser(authResponse.user);
      setMfaRequired(false);
      setMfaUserId(null);
      setPendingCredentials(null);

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
      redirectToDashboard(authResponse.user.role);
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

  const verifyMFA = async (token: string): Promise<void> => {
    if (!mfaUserId || !pendingCredentials) {
      throw new Error('No hay sesión MFA activa');
    }

    try {
      // Retry login with MFA token
      const credentialsWithMFA: LoginFormData = {
        ...pendingCredentials,
        mfaToken: token,
      };

      const response = await authService.login(credentialsWithMFA);

      if ('mfa_required' in response && response.mfa_required) {
        throw new Error('Token MFA inválido');
      }

      // Successful MFA verification
      const authResponse = response as AuthResponse;
      TokenManager.setTokens(authResponse);
      setUser(authResponse.user);
      setMfaRequired(false);
      setMfaUserId(null);
      setPendingCredentials(null);

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
      redirectToDashboard(authResponse.user.role);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const verifyBackupCode = async (code: string): Promise<void> => {
    if (!mfaUserId || !pendingCredentials) {
      throw new Error('No hay sesión MFA activa');
    }

    try {
      // Retry login with backup code
      const credentialsWithBackupCode: LoginFormData = {
        ...pendingCredentials,
        mfaToken: code,
      };

      const response = await authService.login(credentialsWithBackupCode);

      if ('mfa_required' in response && response.mfa_required) {
        throw new Error('Código de respaldo inválido');
      }

      // Successful backup code verification
      const authResponse = response as AuthResponse;
      TokenManager.setTokens(authResponse);
      setUser(authResponse.user);
      setMfaRequired(false);
      setMfaUserId(null);
      setPendingCredentials(null);

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
      redirectToDashboard(authResponse.user.role);
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const clearMFAState = (): void => {
    setMfaRequired(false);
    setMfaUserId(null);
    setPendingCredentials(null);
  };

  // Verification methods
  const getVerificationStatus = async (): Promise<VerificationStatus> => {
    try {
      const status = await verificationApi.getStatus();
      setVerificationStatus(status);
      return status;
    } catch (error) {
      throw error;
    }
  };

  const requestEmailVerification = async (
    data: EmailVerificationRequest = {}
  ): Promise<void> => {
    try {
      await verificationApi.requestEmailVerification(data);
      // Refresh verification status after request
      await getVerificationStatus();
    } catch (error) {
      throw error;
    }
  };

  const confirmEmailVerification = async (
    data: EmailVerificationConfirm
  ): Promise<void> => {
    try {
      await verificationApi.confirmEmailVerification(data);
      // Refresh verification status and user data after confirmation
      await Promise.all([getVerificationStatus(), refreshUser()]);
    } catch (error) {
      throw error;
    }
  };

  const requestPhoneVerification = async (
    data: PhoneVerificationRequest = {}
  ): Promise<void> => {
    try {
      await verificationApi.requestPhoneVerification(data);
      // Refresh verification status after request
      await getVerificationStatus();
    } catch (error) {
      throw error;
    }
  };

  const confirmPhoneVerification = async (
    data: PhoneVerificationConfirm
  ): Promise<void> => {
    try {
      await verificationApi.confirmPhoneVerification(data);
      // Refresh verification status and user data after confirmation
      await Promise.all([getVerificationStatus(), refreshUser()]);
    } catch (error) {
      throw error;
    }
  };

  const resendVerification = async (
    data: ResendVerificationRequest
  ): Promise<void> => {
    try {
      await verificationApi.resendVerification(data);
      // Refresh verification status after resend
      await getVerificationStatus();
    } catch (error) {
      throw error;
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
    mfaRequired,
    mfaUserId,
    verificationStatus,
    login,
    register,
    logout,
    refreshUser,
    requestPasswordReset,
    resetPassword,
    verifyMFA,
    verifyBackupCode,
    clearMFAState,
    getVerificationStatus,
    requestEmailVerification,
    confirmEmailVerification,
    requestPhoneVerification,
    confirmPhoneVerification,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProviderContent>{children}</AuthProviderContent>
    </Suspense>
  );
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
