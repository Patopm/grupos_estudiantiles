'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Auth Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state and reload the page
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center px-4 py-8'>
          <div className='max-w-md w-full'>
            <Card className='shadow-lg border-destructive/20'>
              <CardHeader className='text-center space-y-4'>
                <div className='mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center'>
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className='w-8 h-8 text-destructive'
                    aria-hidden='true'
                  />
                </div>
                <CardTitle className='text-2xl font-bold text-destructive'>
                  Error de Autenticación
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6 text-center'>
                <div className='space-y-2'>
                  <p className='text-muted-foreground'>
                    Ha ocurrido un error inesperado en el sistema de
                    autenticación.
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Por favor intenta recargar la página o regresa al inicio.
                  </p>
                </div>

                {/* Error details for development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className='text-left bg-muted p-3 rounded-md text-xs'>
                    <summary className='cursor-pointer font-medium mb-2'>
                      Detalles del error (desarrollo)
                    </summary>
                    <pre className='whitespace-pre-wrap break-words'>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <div className='flex flex-col sm:flex-row gap-3'>
                  <Button
                    onClick={this.handleRetry}
                    className='flex-1'
                    aria-label='Recargar página'
                  >
                    <FontAwesomeIcon
                      icon={faRefresh}
                      className='w-4 h-4 mr-2'
                    />
                    Reintentar
                  </Button>
                  <Button
                    variant='outline'
                    onClick={this.handleGoHome}
                    className='flex-1'
                    aria-label='Ir a página principal'
                  >
                    Ir al Inicio
                  </Button>
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
