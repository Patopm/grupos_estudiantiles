'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Phone, Loader2, CheckCircle } from 'lucide-react';

interface PhoneVerificationRequestProps {
  onSuccess?: (phoneNumber: string) => void;
  onCancel?: () => void;
  showPhoneInput?: boolean;
  defaultPhone?: string;
}

export default function PhoneVerificationRequest({
  onSuccess,
  onCancel,
  showPhoneInput = true,
  defaultPhone,
}: PhoneVerificationRequestProps) {
  const { user, requestPhoneVerification } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(
    defaultPhone || user?.phone || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 15 digits (international standard)
    const limited = digits.slice(0, 15);

    // Format for Mexican numbers (10 digits)
    if (limited.length <= 10) {
      if (limited.length >= 6) {
        return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
      } else if (limited.length >= 3) {
        return `${limited.slice(0, 3)}-${limited.slice(3)}`;
      }
    }

    return limited;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error('Por favor ingresa un número de teléfono válido');
      return;
    }

    // Validate phone number length (at least 9 digits)
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 9) {
      toast.error('El número de teléfono debe tener al menos 9 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      await requestPhoneVerification(
        showPhoneInput ? { phone_number: phoneNumber } : {}
      );
      setIsSuccess(true);
      toast.success('Código de verificación enviado por SMS');
      onSuccess?.(phoneNumber);
    } catch (error) {
      console.error('Phone verification request error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error enviando código de verificación';
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
              SMS Enviado
            </h3>
            <p className='text-sm text-muted-foreground mt-2'>
              Hemos enviado un código de verificación de 6 dígitos a{' '}
              <span className='font-medium'>{phoneNumber}</span>
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              El código expira en 10 minutos.
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant='outline' className='w-full'>
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
            Verificar Teléfono
          </h2>
          <p className='text-sm text-muted-foreground'>
            Te enviaremos un código de verificación por SMS
          </p>
        </div>

        {showPhoneInput && (
          <div className='space-y-2'>
            <Label htmlFor='phone'>Número de Teléfono</Label>
            <Input
              id='phone'
              type='tel'
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder='555-123-4567'
              required
              disabled={isLoading}
              className='w-full'
            />
            <p className='text-xs text-muted-foreground'>
              Ingresa tu número de teléfono móvil (9-15 dígitos)
            </p>
          </div>
        )}

        {!showPhoneInput && (
          <div className='text-center p-4 bg-muted rounded-lg'>
            <p className='text-sm text-muted-foreground'>
              Se enviará el código SMS a:
            </p>
            <p className='font-medium text-foreground'>{phoneNumber}</p>
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
            disabled={isLoading || !phoneNumber.trim()}
            className='flex-1'
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Enviando...
              </>
            ) : (
              'Enviar Código'
            )}
          </Button>
        </div>

        <div className='text-center'>
          <p className='text-xs text-muted-foreground'>
            Límite: 3 SMS por hora por número de teléfono
          </p>
        </div>
      </form>
    </Card>
  );
}
