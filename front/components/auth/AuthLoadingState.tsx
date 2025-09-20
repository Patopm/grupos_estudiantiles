'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface AuthLoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
}

export default function AuthLoadingState({
  message = 'Cargando...',
  size = 'md',
  showCard = true,
}: AuthLoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const LoadingContent = () => (
    <div className='flex flex-col items-center justify-center space-y-4 py-8'>
      <div className='relative'>
        <FontAwesomeIcon
          icon={faSpinner}
          className={`${sizeClasses[size]} text-primary animate-spin`}
          aria-hidden='true'
        />
      </div>
      <div className='text-center space-y-2'>
        <p className='text-sm font-medium text-foreground' aria-live='polite'>
          {message}
        </p>
        <p className='text-xs text-muted-foreground'>
          Por favor espera un momento...
        </p>
      </div>
    </div>
  );

  if (!showCard) {
    return <LoadingContent />;
  }

  return (
    <Card className='shadow-lg'>
      <CardContent className='p-6'>
        <LoadingContent />
      </CardContent>
    </Card>
  );
}

// Alternative loading states for different contexts
export function AuthLoadingSpinner({
  size = 'sm',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <FontAwesomeIcon
      icon={faSpinner}
      className={`${sizeClasses[size]} text-primary animate-spin`}
      aria-hidden='true'
    />
  );
}

// Inline loading state for form buttons and smaller components
export function AuthInlineLoading({ message }: { message: string }) {
  return (
    <div className='flex items-center space-x-2'>
      <AuthLoadingSpinner size='sm' />
      <span className='text-sm text-muted-foreground'>{message}</span>
    </div>
  );
}
