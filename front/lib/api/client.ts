import { TokenManager } from '../auth';

// API Error types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiPaginatedResponse<T = unknown> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// HTTP client configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { method = 'GET', headers = {}, body, params } = config;

    // Build URL with query parameters
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication token if available
    const token = TokenManager.getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url.toString(), requestOptions);

      // Parse response data
      let data: T;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      // Handle error responses
      if (!response.ok) {
        const error: ApiError = {
          message: this.extractErrorMessage(data),
          status: response.status,
          details:
            typeof data === 'object' ? (data as Record<string, unknown>) : {},
        };
        throw error;
      }

      return data;
    } catch (error) {
      // Re-throw ApiError as-is
      if (this.isApiError(error)) {
        throw error;
      }

      // Handle network errors and other exceptions
      const apiError: ApiError = {
        message:
          error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
        details: { originalError: error },
      };
      throw apiError;
    }
  }

  private extractErrorMessage(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const errorObj = data as Record<string, unknown>;

      // Common error message fields
      if (typeof errorObj.message === 'string') return errorObj.message;
      if (typeof errorObj.detail === 'string') return errorObj.detail;
      if (typeof errorObj.error === 'string') return errorObj.error;

      // Handle validation errors
      if (Array.isArray(errorObj.non_field_errors)) {
        return errorObj.non_field_errors[0] as string;
      }

      // Handle field-specific errors
      const firstFieldError = Object.values(errorObj).find(
        value => Array.isArray(value) && value.length > 0
      );
      if (firstFieldError && Array.isArray(firstFieldError)) {
        return firstFieldError[0] as string;
      }
    }

    return 'An error occurred';
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'status' in error
    );
  }

  // HTTP method shortcuts
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
