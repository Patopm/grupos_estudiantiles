'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthErrorBoundary from './AuthErrorBoundary';
import AuthLoadingState from './AuthLoadingState';

interface AuthLayoutWrapperProps {
  children: ReactNode;
  showHeader?: boolean;
  showLoadingState?: boolean;
  loadingMessage?: string;
  className?: string;
}

/**
 * Consistent authentication layout wrapper component
 * Provides error boundaries, loading states, and consistent styling
 * for all authentication pages
 */
export default function AuthLayoutWrapper({
  children,
  showHeader = true,
  showLoadingState = true,
  loadingMessage = 'Verificando autenticación...',
  className = '',
}: AuthLayoutWrapperProps) {
  const { isLoading } = useAuth();

  return (
    <AuthErrorBoundary>
      <div
        className={`min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center px-4 py-8 ${className}`}
      >
        <div className='max-w-md w-full space-y-8'>
          {/* Header */}
          {showHeader && (
            <div className='text-center'>
              <Link
                href='/'
                className='text-3xl font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md'
                aria-label='Ir a página principal de Grupos Estudiantiles'
              >
                Grupos Estudiantiles
              </Link>
              <p className='text-sm text-muted-foreground mt-2'>
                Universidad Tecmilenio
              </p>
            </div>
          )}

          {/* Content with loading state */}
          {showLoadingState && isLoading ? (
            <AuthLoadingState message={loadingMessage} />
          ) : (
            children
          )}
        </div>
      </div>
    </AuthErrorBoundary>
  );
}

/**
 * Simplified wrapper for pages that don't need auth loading checks
 */
export function SimpleAuthLayoutWrapper({
  children,
  showHeader = true,
  className = '',
}: {
  children: ReactNode;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <AuthErrorBoundary>
      <div
        className={`min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center px-4 py-8 ${className}`}
      >
        <div className='max-w-md w-full space-y-8'>
          {showHeader && (
            <div className='text-center'>
              <Link
                href='/'
                className='text-3xl font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md'
                aria-label='Ir a página principal de Grupos Estudiantiles'
              >
                Grupos Estudiantiles
              </Link>
              <p className='text-sm text-muted-foreground mt-2'>
                Universidad Tecmilenio
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
