'use client';

import React, { ReactNode } from 'react';
import AuthCard from './AuthCard';
import AuthErrorBoundary from './AuthErrorBoundary';
import EnhancedErrorDisplay from './EnhancedErrorDisplay';
import { useAuthError } from '@/hooks/useAuthError';
import { AuthError } from '@/lib/errors/types';

interface AuthFormWrapperProps {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  children: ReactNode;
  isLoading?: boolean;
  loadingMessage?: string;
  className?: string;
  error?: AuthError | null;
  onErrorDismiss?: () => void;
  enableRetry?: boolean;
  showSecurityMeasures?: boolean;
}

/**
 * Enhanced wrapper for authentication forms with comprehensive error handling
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
export default function AuthFormWrapper({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
  children,
  isLoading = false,
  loadingMessage,
  className = '',
  error,
  onErrorDismiss,
  enableRetry = true,
  showSecurityMeasures = true,
}: AuthFormWrapperProps) {
  const {
    error: boundaryError,
    recoveryActions,
    clearError,
  } = useAuthError({
    enableRetry,
    onRecovery: onErrorDismiss,
  });

  // Use provided error or boundary error
  const displayError = error || boundaryError;

  return (
    <AuthErrorBoundary
      enableRetry={enableRetry}
      maxRetries={3}
      showTechnicalDetails={process.env.NODE_ENV === 'development'}
      fallback={
        <div className='max-w-md w-full'>
          <AuthCard
            title='Error en el Formulario'
            subtitle='Ha ocurrido un error al cargar el formulario de autenticación'
            footerText={footerText}
            footerLinkText={footerLinkText}
            footerLinkHref={footerLinkHref}
          >
            <div className='text-center space-y-4'>
              <p className='text-muted-foreground'>
                Por favor recarga la página e intenta de nuevo.
              </p>
              <button
                onClick={() => window.location.reload()}
                className='text-primary hover:text-primary/80 underline'
              >
                Recargar página
              </button>
            </div>
          </AuthCard>
        </div>
      }
    >
      <div className={className}>
        {/* Display error if present */}
        {displayError && (
          <div className='mb-6'>
            <EnhancedErrorDisplay
              error={displayError}
              recoveryActions={recoveryActions}
              onDismiss={onErrorDismiss || clearError}
            />
          </div>
        )}

        <AuthCard
          title={title}
          subtitle={subtitle}
          footerText={footerText}
          footerLinkText={footerLinkText}
          footerLinkHref={footerLinkHref}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        >
          {children}
        </AuthCard>
      </div>
    </AuthErrorBoundary>
  );
}
