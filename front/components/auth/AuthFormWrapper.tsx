'use client';

import React, { ReactNode } from 'react';
import AuthCard from './AuthCard';
import AuthErrorBoundary from './AuthErrorBoundary';

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
}

/**
 * Comprehensive wrapper for authentication forms that includes:
 * - Error boundaries for form-specific errors
 * - Consistent card layout
 * - Loading states
 * - Accessibility improvements
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
}: AuthFormWrapperProps) {
  return (
    <AuthErrorBoundary
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
