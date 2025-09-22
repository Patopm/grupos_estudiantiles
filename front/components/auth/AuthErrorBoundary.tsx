'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faRefresh,
  faBug,
  faEnvelope,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  AuthError,
  ErrorContext,
  ErrorRecoveryAction,
} from '@/lib/errors/types';
import {
  AuthErrorFactory,
  ErrorLogger,
  ErrorRecoveryFactory,
  generateCorrelationId,
} from '@/lib/errors/handlers';
import { RetryManager } from '@/lib/errors/handlers';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AuthError, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  showTechnicalDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  authError?: AuthError;
  retryCount: number;
  isRetrying: boolean;
}

/**
 * Enhanced error boundary for authentication flows
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
class AuthErrorBoundary extends Component<Props, State> {
  private correlationId: string;
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false,
    };
    this.correlationId = generateCorrelationId();
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      sessionId: this.correlationId,
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'AuthErrorBoundary',
      },
    };

    // Create structured auth error
    const authError: AuthError = {
      type: this.categorizeError(error),
      message: this.getErrorMessage(error),
      code: 'COMPONENT_ERROR',
      retryable: this.isRetryableError(error),
      timestamp: new Date(),
      correlationId: this.correlationId,
      details: {
        originalError: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    };

    this.setState({
      error,
      errorInfo,
      authError,
    });

    // Log the error
    ErrorLogger.log(authError, context);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(authError, errorInfo);
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(authError, context);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private categorizeError(error: Error): AuthError['type'] {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }

    if (message.includes('auth') || message.includes('token')) {
      return 'authentication';
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'authorization';
    }

    return 'server';
  }

  private getErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }

    if (message.includes('auth')) {
      return 'Error en el sistema de autenticación.';
    }

    return 'Ha ocurrido un error inesperado en el sistema de autenticación.';
  }

  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch')
    );
  }

  private async reportErrorToService(error: AuthError, context: ErrorContext) {
    try {
      // In a real implementation, send to error tracking service
      console.log('Reporting error to service:', { error, context });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = async () => {
    const { enableRetry = true, maxRetries = 3 } = this.props;

    if (!enableRetry || this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    try {
      // Use retry manager with exponential backoff
      await RetryManager.executeWithRetry(
        async () => {
          // Reset error state
          this.setState({
            hasError: false,
            error: undefined,
            errorInfo: undefined,
            authError: undefined,
            retryCount: this.state.retryCount + 1,
            isRetrying: false,
          });

          // Force re-render
          this.forceUpdate();
        },
        {
          maxRetries: 1,
          baseDelay: 1000 * Math.pow(2, this.state.retryCount),
        }
      );
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleContactSupport = () => {
    const subject = encodeURIComponent('Error de Autenticación');
    const body = encodeURIComponent(
      `Hola,\n\nHe experimentado un error en el sistema de autenticación.\n\n` +
        `ID de correlación: ${this.correlationId}\n` +
        `Fecha: ${new Date().toISOString()}\n` +
        `Error: ${this.state.error?.message || 'Error desconocido'}\n\n` +
        `Por favor, ayúdame a resolver este problema.\n\nGracias.`
    );
    window.open(`mailto:soporte@tecmilenio.mx?subject=${subject}&body=${body}`);
  };

  private getRecoveryActions(): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];
    const { enableRetry = true, maxRetries = 3 } = this.props;

    // Retry action (if retryable and within limits)
    if (
      enableRetry &&
      this.state.authError?.retryable &&
      this.state.retryCount < maxRetries
    ) {
      actions.push({
        type: 'retry',
        label: `Reintentar (${this.state.retryCount + 1}/${maxRetries})`,
        action: this.handleRetry,
        primary: true,
      });
    }

    // Reload action
    actions.push({
      type: 'refresh',
      label: 'Recargar página',
      action: this.handleReload,
      primary: !this.state.authError?.retryable,
    });

    // Home action
    actions.push({
      type: 'redirect',
      label: 'Ir al inicio',
      action: this.handleGoHome,
    });

    // Support action
    actions.push({
      type: 'contact_support',
      label: 'Contactar soporte',
      action: this.handleContactSupport,
    });

    return actions;
  }

  private getSeverityBadge() {
    if (!this.state.authError) return null;

    const severity =
      this.state.authError.type === 'network'
        ? 'secondary'
        : this.state.authError.type === 'authentication'
          ? 'destructive'
          : this.state.authError.type === 'authorization'
            ? 'destructive'
            : 'outline';

    const label =
      this.state.authError.type === 'network'
        ? 'Red'
        : this.state.authError.type === 'authentication'
          ? 'Autenticación'
          : this.state.authError.type === 'authorization'
            ? 'Autorización'
            : 'Sistema';

    return (
      <Badge variant={severity} className='text-xs'>
        {label}
      </Badge>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const recoveryActions = this.getRecoveryActions();

      return (
        <div className='min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center px-4 py-8'>
          <div className='max-w-lg w-full'>
            <Card className='shadow-lg border-destructive/20'>
              <CardHeader className='space-y-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-3 bg-destructive/10 rounded-full'>
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className='w-6 h-6 text-destructive'
                        aria-hidden='true'
                      />
                    </div>
                    <div>
                      <CardTitle className='text-xl font-bold text-destructive'>
                        Error de Autenticación
                      </CardTitle>
                      <div className='flex items-center gap-2 mt-1'>
                        {this.getSeverityBadge()}
                        <span className='text-xs text-muted-foreground'>
                          ID: {this.correlationId.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <p className='text-muted-foreground'>
                    {this.state.authError?.message ||
                      'Ha ocurrido un error inesperado en el sistema de autenticación.'}
                  </p>

                  {this.state.retryCount > 0 && (
                    <p className='text-sm text-muted-foreground'>
                      Intentos realizados: {this.state.retryCount}
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className='space-y-6'>
                {/* Recovery Actions */}
                <div className='space-y-3'>
                  <div className='text-sm font-medium'>
                    Acciones disponibles:
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    {recoveryActions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.primary ? 'default' : 'outline'}
                        size='sm'
                        onClick={action.action}
                        disabled={this.state.isRetrying}
                        className='justify-start'
                      >
                        <FontAwesomeIcon
                          icon={
                            action.type === 'retry'
                              ? faRefresh
                              : action.type === 'refresh'
                                ? faRefresh
                                : action.type === 'contact_support'
                                  ? faEnvelope
                                  : faShieldAlt
                          }
                          className='w-4 h-4 mr-2'
                        />
                        {this.state.isRetrying && action.type === 'retry'
                          ? 'Reintentando...'
                          : action.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Technical Details */}
                {(this.props.showTechnicalDetails ||
                  process.env.NODE_ENV === 'development') &&
                  this.state.error && (
                    <details className='text-xs text-muted-foreground'>
                      <summary className='cursor-pointer font-medium mb-2 flex items-center gap-2'>
                        <FontAwesomeIcon icon={faBug} className='w-3 h-3' />
                        Detalles técnicos
                      </summary>
                      <div className='mt-2 space-y-2'>
                        <div className='bg-muted p-3 rounded-md'>
                          <div className='font-medium mb-1'>Error:</div>
                          <pre className='whitespace-pre-wrap break-words text-xs'>
                            {this.state.error.toString()}
                          </pre>
                        </div>

                        {this.state.errorInfo?.componentStack && (
                          <div className='bg-muted p-3 rounded-md'>
                            <div className='font-medium mb-1'>
                              Component Stack:
                            </div>
                            <pre className='whitespace-pre-wrap break-words text-xs'>
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}

                        <div className='text-xs space-y-1'>
                          <div>Timestamp: {new Date().toISOString()}</div>
                          <div>User Agent: {navigator.userAgent}</div>
                          <div>URL: {window.location.href}</div>
                        </div>
                      </div>
                    </details>
                  )}

                {/* Help Text */}
                <div className='text-xs text-muted-foreground bg-muted/50 p-3 rounded-md'>
                  <p>
                    Si el problema persiste, por favor contacta al soporte
                    técnico incluyendo el ID de correlación mostrado arriba.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
