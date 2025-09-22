/**
 * Hook for managing authentication errors with enhanced error handling
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  AuthError,
  ErrorRecoveryAction,
  RetryConfig,
} from '@/lib/errors/types';
import {
  AuthErrorFactory,
  RetryManager,
  ErrorRecoveryFactory,
  ErrorLogger,
} from '@/lib/errors/handlers';
import { ProgressiveSecurityManager } from '@/lib/errors/security';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthErrorOptions {
  enableRetry?: boolean;
  retryConfig?: Partial<RetryConfig>;
  onError?: (error: AuthError) => void;
  onRecovery?: () => void;
}

interface UseAuthErrorReturn {
  error: AuthError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  recoveryActions: ErrorRecoveryAction[];
  handleError: (error: unknown) => void;
  clearError: () => void;
  retry: () => Promise<void>;
  executeWithErrorHandling: <T>(
    operation: () => Promise<T>,
    context?: string
  ) => Promise<T>;
}

export function useAuthError(
  options: UseAuthErrorOptions = {}
): UseAuthErrorReturn {
  const { enableRetry = true, retryConfig = {}, onError, onRecovery } = options;

  const { logout } = useAuth();
  const [error, setError] = useState<AuthError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOperation, setLastOperation] = useState<
    (() => Promise<any>) | null
  >(null);

  const maxRetries = retryConfig.maxRetries || 3;
  const canRetry =
    enableRetry && (error?.retryable ?? false) && retryCount < maxRetries;

  // Clear error when component unmounts or error changes
  useEffect(() => {
    return () => {
      setError(null);
      setIsRetrying(false);
      setRetryCount(0);
      setLastOperation(null);
    };
  }, []);

  const handleError = useCallback(
    (rawError: unknown) => {
      let authError: AuthError;

      // Convert different error types to AuthError
      if (
        rawError instanceof Error &&
        'type' in rawError &&
        'retryable' in rawError &&
        'timestamp' in rawError
      ) {
        // Already an AuthError
        authError = rawError as AuthError;
      } else if (
        rawError &&
        typeof rawError === 'object' &&
        'status' in rawError
      ) {
        // API Error
        authError = AuthErrorFactory.fromApiError(rawError as ApiError);
      } else if (rawError instanceof Error) {
        // Generic Error
        if (
          rawError.message.includes('NetworkError') ||
          rawError.message.includes('fetch')
        ) {
          authError = AuthErrorFactory.createNetworkError(rawError);
        } else {
          authError = {
            type: 'server',
            message: rawError.message || 'Ha ocurrido un error inesperado.',
            retryable: false,
            timestamp: new Date(),
            correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
        }
      } else {
        // Unknown error
        authError = {
          type: 'server',
          message: 'Ha ocurrido un error inesperado.',
          retryable: false,
          timestamp: new Date(),
          correlationId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      }

      // Record security events for authentication failures
      if (authError.type === 'authentication') {
        ProgressiveSecurityManager.recordFailedAttempt();
      }

      // Log the error
      ErrorLogger.log(authError);

      setError(authError);
      setIsRetrying(false);

      // Call custom error handler
      if (onError) {
        onError(authError);
      }
    },
    [onError]
  );

  const clearError = useCallback(() => {
    setError(null);
    setIsRetrying(false);
    setRetryCount(0);
    setLastOperation(null);

    if (onRecovery) {
      onRecovery();
    }
  }, [onRecovery]);

  const retry = useCallback(async () => {
    if (!canRetry || !lastOperation) {
      return;
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await RetryManager.executeWithRetry(lastOperation, {
        maxRetries: 1, // Single retry attempt
        baseDelay: 1000 * Math.pow(2, retryCount),
        ...retryConfig,
      });

      // Success - clear error state
      clearError();
    } catch (retryError) {
      // Retry failed - update error
      handleError(retryError);
    }
  }, [
    canRetry,
    lastOperation,
    retryCount,
    retryConfig,
    clearError,
    handleError,
  ]);

  const executeWithErrorHandling = useCallback(
    async <T>(operation: () => Promise<T>, context?: string): Promise<T> => {
      // Store operation for potential retry
      setLastOperation(() => operation);

      try {
        // Check security state before attempting operation
        const securityCheck = ProgressiveSecurityManager.canAttemptAuth();
        if (!securityCheck.allowed) {
          const securityError = AuthErrorFactory.createSecurityError(
            'multiple_failures',
            'medium',
            ['Espera antes de intentar de nuevo', 'Verifica tu identidad']
          );

          if (securityCheck.waitTime) {
            (securityError as any).retryAfter = securityCheck.waitTime;
          }

          throw securityError;
        }

        const result = await operation();

        // Success - record successful auth if this was an auth operation
        if (context === 'authentication') {
          ProgressiveSecurityManager.recordSuccessfulAuth();
        }

        // Clear any existing errors on success
        if (error) {
          clearError();
        }

        return result;
      } catch (operationError) {
        handleError(operationError);
        throw operationError;
      }
    },
    [error, handleError, clearError]
  );

  // Generate recovery actions based on current error
  const recoveryActions: ErrorRecoveryAction[] = (() => {
    if (!error) return [];

    const actions: ErrorRecoveryAction[] = [];

    // Retry action
    if (canRetry) {
      actions.push(ErrorRecoveryFactory.createRetryAction(retry));
    }

    // Specific actions based on error type
    switch (error.type) {
      case 'network':
        actions.push(ErrorRecoveryFactory.createRefreshAction());
        break;

      case 'authentication':
        actions.push(
          ErrorRecoveryFactory.createRedirectAction('/login', 'Iniciar sesión')
        );
        break;

      case 'authorization':
        actions.push(
          ErrorRecoveryFactory.createLogoutAction(logout, 'Cerrar sesión')
        );
        break;

      case 'rate_limit':
        // No additional actions - user must wait
        break;

      case 'mfa_required':
        actions.push(
          ErrorRecoveryFactory.createRedirectAction('/login', 'Completar MFA')
        );
        break;

      case 'verification_required':
        actions.push(
          ErrorRecoveryFactory.createRedirectAction(
            '/verify-email',
            'Verificar cuenta'
          )
        );
        break;

      case 'security_violation':
        actions.push(
          ErrorRecoveryFactory.createLogoutAction(
            logout,
            'Cerrar sesión por seguridad'
          )
        );
        break;

      default:
        actions.push(ErrorRecoveryFactory.createRefreshAction());
        break;
    }

    // Always add support action
    actions.push(ErrorRecoveryFactory.createSupportAction(error.correlationId));

    return actions;
  })();

  return {
    error,
    isRetrying,
    retryCount,
    canRetry,
    recoveryActions,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling,
  };
}
