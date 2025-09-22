'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface EmailVerificationConfirmProps {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EmailVerificationConfirm({
  token: propToken,
  onSuccess,
  onError,
}: EmailVerificationConfirmProps) {
  const { confirmEmailVerification, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from props or URL params
  const token = propToken || searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setError('Token de verificación no encontrado');
      onError?.('Token de verificación no encontrado');
    }
  }, [token, onError]);

  const handleVerification = async () => {
    if (!token) {
      setError('Token de verificación requerido');
      onError?.('Token de verificación requerido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmEmailVerification({ token });
      setIsSuccess(true);
      toast.success('Email verificado exitosamente');

      // Refresh user data to get updated verification status
      await refreshUser();

      onSuccess?.();
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error verificando el email';

      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (token) {
      handleVerification();
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard/student'); // Default redirect, will be handled by auth context
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <Card className='max-w-md mx-auto p-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <Loader2 className='h-12 w-12 text-primary animate-spin' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>
              Verificando Email
            </h3>
            <p className='text-sm text-muted-foreground'>
              Por favor espera mientras verificamos tu email...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className='max-w-md mx-auto p-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <CheckCircle className='h-12 w-12 text-green-500' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>
              Email Verificado
            </h3>
            <p className='text-sm text-muted-foreground'>
              Tu email ha sido verificado exitosamente. Ahora puedes acceder a
              todas las funciones de la plataforma.
            </p>
          </div>
          <div className='flex gap-3'>
            <Button onClick={handleGoToDashboard} className='flex-1'>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='max-w-md mx-auto p-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <XCircle className='h-12 w-12 text-red-500' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>
              Error de Verificación
            </h3>
            <p className='text-sm text-muted-foreground'>{error}</p>
            {error.includes('expirado') && (
              <p className='text-xs text-muted-foreground mt-2'>
                Los enlaces de verificación expiran después de 24 horas. Puedes
                solicitar un nuevo enlace desde tu perfil.
              </p>
            )}
          </div>
          <div className='flex gap-3'>
            <Button
              onClick={handleGoToLogin}
              variant='outline'
              className='flex-1'
            >
              Ir al Login
            </Button>
            {token && (
              <Button onClick={handleRetry} className='flex-1'>
                Reintentar
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Fallback - should not reach here
  return (
    <Card className='max-w-md mx-auto p-6'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <Mail className='h-12 w-12 text-muted-foreground' />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-foreground'>
            Verificación de Email
          </h3>
          <p className='text-sm text-muted-foreground'>
            Preparando verificación...
          </p>
        </div>
      </div>
    </Card>
  );
}
