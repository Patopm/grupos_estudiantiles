/**
 * Error handling utilities and factories
 * Requirement 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { ApiError } from '../api/client';
import {
  AuthError,
  AuthErrorType,
  NetworkError,
  RateLimitError,
  MFAError,
  VerificationError,
  ValidationError,
  SecurityError,
  ErrorContext,
  RetryConfig,
  ErrorRecoveryAction,
} from './types';

// Generate correlation ID for error tracking
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Error factory functions
export class AuthErrorFactory {
  static createNetworkError(
    originalError: Error,
    context?: Partial<ErrorContext>
  ): NetworkError {
    return {
      type: 'network',
      message: 'Error de conexión. Verifica tu conexión a internet.',
      retryable: true,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
      details: {
        originalError: originalError.message,
        ...context,
      },
    };
  }

  static createRateLimitError(
    retryAfter: number,
    remainingAttempts?: number
  ): RateLimitError {
    const resetTime = new Date(Date.now() + retryAfter * 1000);

    return {
      type: 'rate_limit',
      message: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfter / 60)} minutos.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: true,
      retryAfter,
      remainingAttempts,
      resetTime,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  }

  static createMFAError(
    subType: 'required' | 'invalid',
    mfaType?: 'totp' | 'backup_code' | 'sms',
    attemptsRemaining?: number,
    backupCodesRemaining?: number
  ): MFAError {
    const messages = {
      required: 'Se requiere autenticación de dos factores.',
      invalid: 'Código de autenticación inválido. Verifica e intenta de nuevo.',
    };

    return {
      type: subType === 'required' ? 'mfa_required' : 'mfa_invalid',
      message: messages[subType],
      code: subType === 'required' ? 'MFA_REQUIRED' : 'MFA_INVALID',
      retryable: subType === 'invalid',
      mfaType,
      attemptsRemaining,
      backupCodesRemaining,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  }

  static createVerificationError(
    subType: 'required' | 'invalid',
    verificationType?: 'email' | 'phone',
    canResend?: boolean,
    resendAvailableAt?: Date
  ): VerificationError {
    const messages = {
      required: `Verificación de ${verificationType === 'email' ? 'correo electrónico' : 'teléfono'} requerida.`,
      invalid: `Código de verificación inválido. Verifica e intenta de nuevo.`,
    };

    return {
      type:
        subType === 'required'
          ? 'verification_required'
          : 'verification_invalid',
      message: messages[subType],
      code:
        subType === 'required'
          ? 'VERIFICATION_REQUIRED'
          : 'VERIFICATION_INVALID',
      retryable: subType === 'invalid',
      verificationType,
      canResend,
      resendAvailableAt,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  }

  static createValidationError(
    message: string,
    fieldErrors?: Record<string, string[]>,
    field?: string
  ): ValidationError {
    return {
      type: 'validation',
      message,
      code: 'VALIDATION_ERROR',
      field,
      retryable: false,
      fieldErrors,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  }

  static createSecurityError(
    violationType:
      | 'suspicious_activity'
      | 'multiple_failures'
      | 'location_change',
    securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recommendedActions?: string[]
  ): SecurityError {
    const messages = {
      suspicious_activity: 'Se detectó actividad sospechosa en tu cuenta.',
      multiple_failures: 'Múltiples intentos fallidos detectados.',
      location_change: 'Inicio de sesión desde una nueva ubicación detectado.',
    };

    return {
      type: 'security_violation',
      message: messages[violationType],
      code: 'SECURITY_VIOLATION',
      retryable: false,
      violationType,
      securityLevel,
      recommendedActions,
      timestamp: new Date(),
      correlationId: generateCorrelationId(),
    };
  }

  static fromApiError(
    apiError: ApiError,
    context?: Partial<ErrorContext>
  ): AuthError {
    const correlationId = generateCorrelationId();

    // Rate limiting
    if (apiError.status === 429) {
      const retryAfter = (apiError.details?.retry_after as number) || 300;
      return this.createRateLimitError(retryAfter);
    }

    // Authentication errors
    if (apiError.status === 401) {
      return {
        type: 'authentication',
        message:
          'Credenciales incorrectas. Verifica tus datos e intenta de nuevo.',
        code: 'AUTHENTICATION_FAILED',
        retryable: true,
        timestamp: new Date(),
        correlationId,
        details: apiError.details,
      };
    }

    // Authorization errors
    if (apiError.status === 403) {
      return {
        type: 'authorization',
        message: 'No tienes permisos para realizar esta acción.',
        code: 'AUTHORIZATION_FAILED',
        retryable: false,
        timestamp: new Date(),
        correlationId,
        details: apiError.details,
      };
    }

    // Validation errors
    if (apiError.status === 400) {
      return this.createValidationError(
        apiError.message,
        apiError.details as Record<string, string[]>
      );
    }

    // Server errors
    if (apiError.status >= 500) {
      return {
        type: 'server',
        message: 'Error del servidor. Por favor intenta más tarde.',
        code: 'SERVER_ERROR',
        retryable: true,
        timestamp: new Date(),
        correlationId,
        details: apiError.details,
      };
    }

    // Default error
    return {
      type: 'server',
      message: apiError.message || 'Ha ocurrido un error inesperado.',
      retryable: false,
      timestamp: new Date(),
      correlationId,
      details: apiError.details,
    };
  }
}

// Retry mechanism with exponential backoff
export class RetryManager {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
  };

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt
        if (attempt === finalConfig.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (
          error instanceof Error &&
          'retryable' in error &&
          !error.retryable
        ) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);

    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Error recovery action factory
export class ErrorRecoveryFactory {
  static createRetryAction(
    operation: () => Promise<void>,
    label: string = 'Reintentar'
  ): ErrorRecoveryAction {
    return {
      type: 'retry',
      label,
      action: operation,
      primary: true,
    };
  }

  static createRefreshAction(
    label: string = 'Recargar página'
  ): ErrorRecoveryAction {
    return {
      type: 'refresh',
      label,
      action: () => window.location.reload(),
    };
  }

  static createRedirectAction(url: string, label: string): ErrorRecoveryAction {
    return {
      type: 'redirect',
      label,
      action: () => {
        window.location.href = url;
      },
    };
  }

  static createLogoutAction(
    logoutFn: () => Promise<void>,
    label: string = 'Cerrar sesión'
  ): ErrorRecoveryAction {
    return {
      type: 'logout',
      label,
      action: logoutFn,
    };
  }

  static createSupportAction(
    correlationId?: string,
    label: string = 'Contactar soporte'
  ): ErrorRecoveryAction {
    return {
      type: 'contact_support',
      label,
      action: () => {
        const subject = encodeURIComponent('Error en autenticación');
        const body = encodeURIComponent(
          `Hola,\n\nHe experimentado un error en el sistema de autenticación.\n\n` +
            `ID de correlación: ${correlationId || 'N/A'}\n` +
            `Fecha: ${new Date().toISOString()}\n\n` +
            `Por favor, ayúdame a resolver este problema.\n\nGracias.`
        );
        window.open(
          `mailto:soporte@tecmilenio.mx?subject=${subject}&body=${body}`
        );
      },
    };
  }
}

// Error logging utility
export class ErrorLogger {
  static log(error: AuthError, context?: ErrorContext): void {
    const logData = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error:', logData);
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureError(logData);
    }
  }

  static logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, unknown>
  ): void {
    const logData = {
      type: 'security_event',
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.warn('Security Event:', logData);

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      // securityService.logEvent(logData);
    }
  }
}
