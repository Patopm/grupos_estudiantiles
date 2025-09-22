import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from './validations/auth';

// Types for authentication responses
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
  // MFA and verification status
  email_verified?: boolean;
  phone_verified?: boolean;
  mfa_enabled?: boolean;
  mfa_required?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  mfa_required?: boolean;
}

export interface MFARequiredResponse {
  mfa_required: true;
  message: string;
  user_id: string;
  temp_token?: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  full_name: string;
  student_id: string;
  phone: string;
  is_active_student: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Authentication service class
class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api/auth`;
  }

  /**
   * Login user with email and password, with optional MFA token
   */
  async login(
    credentials: LoginFormData
  ): Promise<AuthResponse | MFARequiredResponse> {
    const response = await fetch(`${this.baseURL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.email, // Backend expects username field
        password: credentials.password,
        mfa_token: credentials.mfaToken, // Include MFA token if provided
      }),
    });

    const data = await response.json();

    // Handle MFA required response (202 status)
    if (response.status === 202) {
      return {
        mfa_required: true,
        message: data.message || 'Se requiere autenticación de dos factores',
        user_id: data.user_id,
        temp_token: data.temp_token,
      } as MFARequiredResponse;
    }

    if (!response.ok) {
      // Handle different types of errors
      if (response.status === 401) {
        throw new Error(
          'Credenciales incorrectas. Verifica tu email y contraseña.'
        );
      } else if (response.status === 400) {
        const errorMessage =
          data.detail ||
          data.non_field_errors?.[0] ||
          'Datos de inicio de sesión inválidos.';
        throw new Error(errorMessage);
      } else {
        throw new Error('Error del servidor. Por favor intenta más tarde.');
      }
    }

    return data;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterFormData): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseURL}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.email, // Use email as username
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        student_id: userData.studentId,
        phone: userData.phone,
        password: userData.password,
        password_confirm: userData.confirmPassword,
        role: 'student', // Default role for registration
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400) {
        // Extract field-specific errors
        const errors = [];

        if (data.username) {
          errors.push(`Email: ${data.username[0]}`);
        }
        if (data.email) {
          errors.push(`Email: ${data.email[0]}`);
        }
        if (data.student_id) {
          errors.push(`Matrícula: ${data.student_id[0]}`);
        }
        if (data.phone) {
          errors.push(`Teléfono: ${data.phone[0]}`);
        }
        if (data.password) {
          errors.push(`Contraseña: ${data.password[0]}`);
        }
        if (data.password_confirm) {
          errors.push(
            `Confirmación de contraseña: ${data.password_confirm[0]}`
          );
        }
        if (data.non_field_errors) {
          errors.push(...data.non_field_errors);
        }

        const errorMessage =
          errors.length > 0
            ? errors.join('. ')
            : 'Error en los datos proporcionados.';

        throw new Error(errorMessage);
      } else {
        throw new Error('Error del servidor. Por favor intenta más tarde.');
      }
    }

    return data;
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${this.baseURL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });
    } catch (error) {
      // Even if logout fails on server, we'll clear local tokens
      console.warn('Logout request failed:', error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<{ access: string; refresh?: string }> {
    const response = await fetch(`${this.baseURL}/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  }

  /**
   * Get current user information
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${this.baseURL}/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user information');
    }

    return response.json();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: ForgotPasswordFormData): Promise<void> {
    const response = await fetch(`${this.baseURL}/password-reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        const errorMessage =
          data.email?.[0] ||
          data.detail ||
          'Error en la solicitud de restablecimiento.';
        throw new Error(errorMessage);
      } else if (response.status === 404) {
        throw new Error(
          'No se encontró una cuenta con este correo electrónico.'
        );
      } else {
        throw new Error('Error del servidor. Por favor intenta más tarde.');
      }
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    uid: string,
    passwordData: ResetPasswordFormData
  ): Promise<void> {
    const response = await fetch(`${this.baseURL}/password-reset-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: uid,
        token: token,
        new_password: passwordData.password,
        new_password_confirm: passwordData.confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        // Handle validation errors
        const errors = [];

        if (data.new_password) {
          errors.push(`Contraseña: ${data.new_password[0]}`);
        }
        if (data.new_password_confirm) {
          errors.push(
            `Confirmación de contraseña: ${data.new_password_confirm[0]}`
          );
        }
        if (data.token) {
          errors.push(
            'El enlace de restablecimiento ha expirado o es inválido.'
          );
        }
        if (data.uid) {
          errors.push('El enlace de restablecimiento es inválido.');
        }
        if (data.non_field_errors) {
          errors.push(...data.non_field_errors);
        }

        const errorMessage =
          errors.length > 0
            ? errors.join('. ')
            : 'Error en el restablecimiento de contraseña.';

        throw new Error(errorMessage);
      } else {
        throw new Error('Error del servidor. Por favor intenta más tarde.');
      }
    }
  }

  /**
   * Get MFA status for the current user
   */
  async getMFAStatus(accessToken: string): Promise<{
    mfa_enabled: boolean;
    totp_configured: boolean;
    backup_codes_count: number;
    mfa_required: boolean;
  }> {
    const response = await fetch(`${this.baseURL}/mfa/status/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get MFA status');
    }

    return response.json();
  }

  /**
   * Verify MFA token (TOTP or backup code)
   */
  async verifyMFAToken(
    token: string,
    accessToken?: string
  ): Promise<{
    valid: boolean;
    message: string;
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseURL}/mfa/totp/verify/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Token MFA inválido');
    }

    return data;
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    code: string,
    accessToken?: string
  ): Promise<{
    valid: boolean;
    message: string;
    remaining_codes?: number;
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseURL}/mfa/backup-codes/verify/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Código de respaldo inválido');
    }

    return data;
  }
}

// Token management utilities
export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_KEY = 'user_data';

  /**
   * Set cookie with proper security settings
   */
  private static setCookie(name: string, value: string, maxAge?: number): void {
    if (typeof document !== 'undefined') {
      const secure = window.location.protocol === 'https:';
      const sameSite = 'lax';
      const path = '/';

      let cookieString = `${name}=${encodeURIComponent(value)}; path=${path}; samesite=${sameSite}`;

      if (secure) {
        cookieString += '; secure';
      }

      if (maxAge) {
        cookieString += `; max-age=${maxAge}`;
      }

      document.cookie = cookieString;
    }
  }

  /**
   * Remove cookie
   */
  private static removeCookie(name: string): void {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }

  /**
   * Store authentication tokens and user data
   */
  static setTokens(tokens: AuthResponse): void {
    if (typeof window !== 'undefined') {
      // Store in localStorage for client-side access
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      localStorage.setItem(this.USER_KEY, JSON.stringify(tokens.user));

      // Also store in cookies for server-side middleware access
      // Calculate token expiration for cookie max-age
      const accessTokenPayload = this.decodeTokenPayload(tokens.access);
      const refreshTokenPayload = this.decodeTokenPayload(tokens.refresh);

      const accessTokenMaxAge = accessTokenPayload
        ? Math.max(0, accessTokenPayload.exp - Math.floor(Date.now() / 1000))
        : 15 * 60; // Default 15 minutes

      const refreshTokenMaxAge = refreshTokenPayload
        ? Math.max(0, refreshTokenPayload.exp - Math.floor(Date.now() / 1000))
        : 7 * 24 * 60 * 60; // Default 7 days

      this.setCookie(this.ACCESS_TOKEN_KEY, tokens.access, accessTokenMaxAge);
      this.setCookie(
        this.REFRESH_TOKEN_KEY,
        tokens.refresh,
        refreshTokenMaxAge
      );
      this.setCookie(
        this.USER_KEY,
        JSON.stringify(tokens.user),
        refreshTokenMaxAge
      );
    }
  }

  /**
   * Decode token payload
   */
  private static decodeTokenPayload(
    token: string
  ): { exp: number; iat: number } | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  /**
   * Get stored user data
   */
  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  /**
   * Update access token (for refresh)
   */
  static updateAccessToken(accessToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

      // Also update cookie
      const tokenPayload = this.decodeTokenPayload(accessToken);
      const maxAge = tokenPayload
        ? Math.max(0, tokenPayload.exp - Math.floor(Date.now() / 1000))
        : 15 * 60; // Default 15 minutes

      this.setCookie(this.ACCESS_TOKEN_KEY, accessToken, maxAge);
    }
  }

  /**
   * Clear all authentication data
   */
  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      // Clear localStorage
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);

      // Clear cookies
      this.removeCookie(this.ACCESS_TOKEN_KEY);
      this.removeCookie(this.REFRESH_TOKEN_KEY);
      this.removeCookie(this.USER_KEY);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getUser();
  }

  /**
   * Check if token is expired (basic check)
   */
  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
