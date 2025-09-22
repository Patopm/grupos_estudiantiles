'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface EmailVerificationRequestProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  showEmailInput?: boolean;
  defaultEmail?: string;
}

export default function EmailVerificationRequest({
  onSuccess,
  onCancel,
  showEmailInput = true,
  defaultEmail,
}: EmailVerificationRequestProps) {
  const { user, requestEmailVerification } = useAuth();
  const [email, setEmail] = useState(defaultEmail || user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    try {
      await requestEmailVerification(showEmailInput ? { email } : {});
      setIsSuccess(true);
      toast.success('Email de verificación enviado exitosamente');
      onSuccess?.();
    } catch (error) {
      console.error('Email verification request error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error enviando email de verificación';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className='max-w-md mx-auto p-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <CheckCircle className='h-12 w-12 text-green-500' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>
              Email Enviado
            </h3>
            <p className='text-sm text-muted-foreground mt-2'>
              Hemos enviado un enlace de verificación a{' '}
              <span className='font-medium'>{email}</span>
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              Revisa tu bandeja de entrada y haz clic en el enlace para
              verificar tu email.
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' className='w-full'>
              Cerrar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className='max-w-md mx-auto p-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Mail className='h-8 w-8 text-primary' />
          </div>
          <h2 className='text-xl font-semibold text-foreground'>
            Verificar Email
          </h2>
          <p className='text-sm text-muted-foreground'>
            Te enviaremos un enlace de verificación a tu email
          </p>
        </div>

        {showEmailInput && (
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='tu-email@tecmilenio.mx'
              required
              disabled={isLoading}
              className='w-full'
            />
            <p className='text-xs text-muted-foreground'>
              Debe ser un email válido del dominio @tecmilenio.mx
            </p>
          </div>
        )}

        {!showEmailInput && (
          <div className='text-center p-4 bg-muted rounded-lg'>
            <p className='text-sm text-muted-foreground'>
              Se enviará la verificación a:
            </p>
            <p className='font-medium text-foreground'>{email}</p>
          </div>
        )}

        <div className='flex gap-3'>
          {onCancel && (
            <Button
              type='button'
              onClick={onCancel}
              variant='outline'
              disabled={isLoading}
              className='flex-1'
            >
              Cancelar
            </Button>
          )}
          <Button
            type='submit'
            disabled={isLoading || !email.trim()}
            className='flex-1'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Enviando...
              </>
            ) : (
              'Enviar Verificación'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
