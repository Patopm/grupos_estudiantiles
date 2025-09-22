'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2, Phone, RotateCcw } from 'lucide-react';

interface PhoneVerificationConfirmProps {
  phoneNumber: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onResend?: () => void;
  showResendButton?: boolean;
}

export default function PhoneVerificationConfirm({
  phoneNumber,
  onSuccess,
  onCancel,
  onResend,
  showResendButton = true,
}: PhoneVerificationConfirmProps) {
  const { confirmPhoneVerification, resendVerification } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmPhoneVerification({
        phone_number: phoneNumber,
        token: code,
      });

      setIsSuccess(true);
      toast.success('Teléfono verificado exitosamente');
      onSuccess?.();
    } catch (error) {
      console.error('Phone verification error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error verificando el código';

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsResending(true);
    try {
      await resendVerification({
        verification_type: 'phone',
        phone_number: phoneNumber,
      });

      toast.success('Nuevo código enviado');
      setTimeLeft(600); // Reset timer
      setCanResend(false);
      setCode('');
      setError(null);
      onResend?.();
    } catch (error) {
      console.error('Resend error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Error reenviando código';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
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
              Teléfono Verificado
            </h3>
            <p className='text-sm text-muted-foreground'>
              Tu número de teléfono {phoneNumber} ha sido verificado
              exitosamente.
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} className='w-full'>
              Continuar
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
            <Phone className='h-8 w-8 text-primary' />
          </div>
          <h2 className='text-xl font-semibold text-foreground'>
            Verificar Código SMS
          </h2>
          <p className='text-sm text-muted-foreground'>
            Ingresa el código de 6 dígitos enviado a
          </p>
          <p className='font-medium text-foreground'>{phoneNumber}</p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='code'>Código de Verificación</Label>
          <Input
            id='code'
            type='text'
            value={code}
            onChange={handleCodeChange}
            placeholder='000000'
            maxLength={6}
            className='text-center text-lg tracking-widest font-mono'
            disabled={isLoading}
            autoComplete='one-time-code'
          />
          {error && (
            <p className='text-sm text-red-500 flex items-center gap-1'>
              <XCircle className='h-4 w-4' />
              {error}
            </p>
          )}
        </div>

        <div className='text-center space-y-2'>
          {timeLeft > 0 ? (
            <p className='text-sm text-muted-foreground'>
              El código expira en {formatTime(timeLeft)}
            </p>
          ) : (
            <p className='text-sm text-red-500'>El código ha expirado</p>
          )}
        </div>

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
            disabled={isLoading || code.length !== 6 || timeLeft === 0}
            className='flex-1'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Verificando...
              </>
            ) : (
              'Verificar Código'
            )}
          </Button>
        </div>

        {showResendButton && (
          <div className='text-center'>
            <Button
              type='button'
              onClick={handleResend}
              variant='ghost'
              size='sm'
              disabled={!canResend || isResending}
              className='text-sm'
            >
              {isResending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Reenviando...
                </>
              ) : (
                <>
                  <RotateCcw className='mr-2 h-4 w-4' />
                  {canResend
                    ? 'Reenviar código'
                    : `Reenviar en ${formatTime(timeLeft)}`}
                </>
              )}
            </Button>
          </div>
        )}

        <div className='text-center'>
          <p className='text-xs text-muted-foreground'>
            ¿No recibiste el código? Verifica que el número sea correcto.
          </p>
        </div>
      </form>
    </Card>
  );
}
