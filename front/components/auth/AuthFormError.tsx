'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationCircle,
  faCheckCircle,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

interface AuthFormErrorProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  className?: string;
}

export default function AuthFormError({
  message,
  type = 'error',
  className = '',
}: AuthFormErrorProps) {
  const baseClasses = 'p-3 text-sm border rounded-md flex items-start gap-2';

  const typeClasses = {
    error: 'text-destructive bg-destructive/10 border-destructive/20',
    success: 'text-green-700 bg-green-50 border-green-200',
    info: 'text-blue-700 bg-blue-50 border-blue-200',
  };

  const icons = {
    error: faExclamationCircle,
    success: faCheckCircle,
    info: faInfoCircle,
  };

  const iconColors = {
    error: 'text-destructive',
    success: 'text-green-600',
    info: 'text-blue-600',
  };

  return (
    <div
      className={`${baseClasses} ${typeClasses[type]} ${className}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <FontAwesomeIcon
        icon={icons[type]}
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[type]}`}
        aria-hidden='true'
      />
      <span className='flex-1'>{message}</span>
    </div>
  );
}

// Specialized components for common use cases
export function AuthSuccessMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <AuthFormError message={message} type='success' className={className} />
  );
}

export function AuthInfoMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return <AuthFormError message={message} type='info' className={className} />;
}

export function AuthErrorMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return <AuthFormError message={message} type='error' className={className} />;
}
