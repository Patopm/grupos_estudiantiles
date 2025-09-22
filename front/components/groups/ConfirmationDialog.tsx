'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: ConfirmationDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
      onClick={handleBackdropClick}
      role='dialog'
      aria-modal='true'
      aria-labelledby='dialog-title'
      aria-describedby='dialog-description'
    >
      <Card className='w-full max-w-md mx-auto shadow-lg'>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              {variant === 'destructive' && (
                <div className='w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0'>
                  <AlertTriangle className='w-5 h-5 text-destructive' />
                </div>
              )}
              <CardTitle id='dialog-title' className='text-lg'>
                {title}
              </CardTitle>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={onClose}
              disabled={isLoading}
              className='h-8 w-8 -mt-1 -mr-1'
              aria-label='Cerrar diálogo'
            >
              <X className='w-4 h-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <p
            id='dialog-description'
            className='text-muted-foreground leading-relaxed'
          >
            {description}
          </p>

          <div className='flex flex-col-reverse sm:flex-row gap-3 sm:justify-end'>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              {cancelText}
            </Button>
            <Button
              variant={variant === 'destructive' ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              {isLoading ? 'Procesando...' : confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
