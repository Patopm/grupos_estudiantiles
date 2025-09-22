import { TokenManager } from '../auth';
import { RetryManager } from '../errors/handlers';
import { generateCorrelationId } from '../errors/handlers';

// Enhanced API Error types
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
  correlationId?: string;
  retryable?: boolean;
  retryAfter?: number;
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
  timeout?: number;
  retryable?: boolean;
  correlationId?: string;
}

/**
 * Enhanced API client with comprehensive error handling and retry mechanisms
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      timeout = this.defaultTimeout,
      retryable = true,
      correlationId = generateCorrelationId(),
    } = config;

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
      'X-Correlation-ID': correlationId,
      'X-Request-ID': generateCorrelationId(),
      ...headers,
    };

    // Set Content-Type based on body type, unless explicitly overridden
    if (!('Content-Type' in headers)) {
      if (body instanceof FormData) {
        // Don't set Content-Type for FormData - let browser set it with boundary
      } else {
        requestHeaders['Content-Type'] = 'application/json';
      }
    } else if (headers['Content-Type']) {
      requestHeaders['Content-Type'] = headers['Content-Type'];
    }

    // Add authentication token if available
    const token = TokenManager.getAccessToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    const executeRequest = async (): Promise<T> => {
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
            correlationId,
            retryable: this.isRetryableStatus(response.status),
            retryAfter: this.extractRetryAfter(response),
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
        const isNetworkError =
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('NetworkError') ||
            error.message.includes('fetch'));

        const apiError: ApiError = {
          message: isNetworkError
            ? 'Error de conexión. Verifica tu conexión a internet.'
            : error instanceof Error
              ? error.message
              : 'Error inesperado',
          status: 0,
          details: { originalError: error },
          correlationId,
          retryable: isNetworkError,
        };
        throw apiError;
      }
    };

    // Execute with retry if retryable
    if (retryable && (method === 'GET' || method === 'POST')) {
      return RetryManager.executeWithRetry(executeRequest, {
        maxRetries: method === 'GET' ? 3 : 1, // More retries for GET requests
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
      });
    }

    return executeRequest();
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

      // Handle rate limiting
      if (
        errorObj.detail &&
        typeof errorObj.detail === 'string' &&
        errorObj.detail.includes('rate limit')
      ) {
        return 'Demasiados intentos. Por favor espera antes de intentar de nuevo.';
      }
    }

    return 'Ha ocurrido un error';
  }

  private extractRetryAfter(response: Response): number | undefined {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? undefined : seconds;
    }
    return undefined;
  }

  private isRetryableStatus(status: number): boolean {
    // Retryable status codes
    return (
      status >= 500 || // Server errors
      status === 429 || // Rate limiting
      status === 408 || // Request timeout
      status === 502 || // Bad gateway
      status === 503 || // Service unavailable
      status === 504
    ); // Gateway timeout
  }

  private isApiError(error: unknown): error is ApiError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'status' in error
    );
  }

  // HTTP method shortcuts with enhanced error handling
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
      ...options,
    });
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      retryable: false, // PUT requests are not idempotent by default
      ...options,
    });
  }

  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      retryable: false, // PATCH requests are not idempotent by default
      ...options,
    });
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      retryable: false, // DELETE requests should not be retried
      ...options,
    });
  }

  // Utility methods for error handling
  isNetworkError(error: ApiError): boolean {
    return error.status === 0;
  }

  isRateLimitError(error: ApiError): boolean {
    return error.status === 429;
  }

  isAuthenticationError(error: ApiError): boolean {
    return error.status === 401;
  }

  isAuthorizationError(error: ApiError): boolean {
    return error.status === 403;
  }

  isValidationError(error: ApiError): boolean {
    return error.status === 400;
  }

  isServerError(error: ApiError): boolean {
    return error.status >= 500;
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health/', undefined, {
      timeout: 5000,
      retryable: true,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
