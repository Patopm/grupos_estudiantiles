import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

interface AuthButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  className?: string;
  disabled?: boolean;
}

export default function AuthButton({
  isLoading,
  loadingText,
  children,
  type = 'submit',
  onClick,
  variant = 'default',
  className = '',
  disabled = false,
}: AuthButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <Button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`w-full ${className}`}
      size='lg'
      variant={variant}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
    >
      {isLoading ? (
        <div className='flex items-center gap-2'>
          <FontAwesomeIcon
            icon={faSpinner}
            className='animate-spin w-4 h-4'
            aria-hidden='true'
          />
          <span aria-live='polite'>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
