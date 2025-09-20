'use client';

import React from 'react';
import AuthLayoutWrapper from '@/components/auth/AuthLayoutWrapper';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Authentication group layout that provides consistent styling,
 * error boundaries, and loading states for all auth pages
 */
export default function AuthGroupLayout({ children }: AuthLayoutProps) {
  return (
    <AuthLayoutWrapper
      showHeader={true}
      showLoadingState={true}
      loadingMessage='Verificando autenticación...'
    >
      {children}
    </AuthLayoutWrapper>
  );
}
