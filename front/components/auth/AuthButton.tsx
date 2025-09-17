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
}

export default function AuthButton({
  isLoading,
  loadingText,
  children,
  type = 'submit',
  onClick,
}: AuthButtonProps) {
  return (
    <Button
      type={type}
      disabled={isLoading}
      onClick={onClick}
      className='w-full'
      size='lg'
    >
      {isLoading ? (
        <div className='flex items-center gap-2'>
          <FontAwesomeIcon icon={faSpinner} className='animate-spin' />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
