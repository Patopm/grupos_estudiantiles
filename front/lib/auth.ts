import { LoginFormData, RegisterFormData } from './validations/auth';

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
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
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
   * Login user with email and password
   */
  async login(credentials: LoginFormData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: credentials.email, // Backend expects username field
        password: credentials.password,
      }),
    });

    const data = await response.json();

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
}

// Token management utilities
export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static USER_KEY = 'user_data';

  /**
   * Store authentication tokens and user data
   */
  static setTokens(tokens: AuthResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      localStorage.setItem(this.USER_KEY, JSON.stringify(tokens.user));
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
    }
  }

  /**
   * Clear all authentication data
   */
  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
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
