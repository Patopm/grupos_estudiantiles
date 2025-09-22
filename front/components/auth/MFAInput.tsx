'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield,
  faSpinner,
  faKey,
  faArrowLeft,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';

interface MFAInputProps {
  onBack?: () => void;
}

export default function MFAInput({ onBack }: MFAInputProps) {
  const { verifyMFA, verifyBackupCode, clearMFAState } = useAuth();
  const [mfaToken, setMfaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showBackupCode, setShowBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mfaToken.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (showBackupCode) {
        await verifyBackupCode(mfaToken.toUpperCase());
      } else {
        await verifyMFA(mfaToken);
      }
      // Redirect is handled by AuthContext
    } catch (error) {
      console.error('MFA verification error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Código de verificación inválido. Por favor intenta de nuevo.';
      setError(errorMessage);
      setMfaToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenInput = (value: string) => {
    // For TOTP: only allow numbers and limit to 6 digits
    // For backup codes: allow alphanumeric and limit to 8 characters
    if (showBackupCode) {
      const cleanValue = value
        .replace(/[^A-Z0-9]/gi, '')
        .slice(0, 8)
        .toUpperCase();
      setMfaToken(cleanValue);
    } else {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setMfaToken(numericValue);
    }

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleBack = () => {
    clearMFAState();
    if (onBack) {
      onBack();
    }
  };

  const toggleBackupCode = () => {
    setShowBackupCode(!showBackupCode);
    setMfaToken('');
    setError('');
  };

  return (
    <Card className='max-w-md mx-auto p-6'>
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4'>
            <FontAwesomeIcon
              icon={faShield}
              className='text-2xl text-blue-600 dark:text-blue-400'
            />
          </div>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
            Verificación de Dos Factores
          </h3>
          <p className='text-gray-600 dark:text-gray-400'>
            {showBackupCode
              ? 'Ingresa uno de tus códigos de respaldo'
              : 'Ingresa el código de 6 dígitos de tu aplicación autenticadora'}
          </p>
        </div>

        {error && (
          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <div className='flex items-center'>
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className='text-red-600 dark:text-red-400 mr-2'
              />
              <p className='text-red-800 dark:text-red-400 text-sm'>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='mfaToken'>
              {showBackupCode ? 'Código de Respaldo' : 'Código de Verificación'}
            </Label>
            <Input
              id='mfaToken'
              value={mfaToken}
              onChange={e => handleTokenInput(e.target.value)}
              placeholder={showBackupCode ? 'ABC12345' : '000000'}
              className={`mt-1 text-center text-2xl tracking-widest font-mono ${
                error ? 'border-red-500' : ''
              }`}
              maxLength={showBackupCode ? 8 : 6}
              autoComplete='off'
              autoFocus
            />
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              {showBackupCode
                ? 'Código de 8 caracteres (letras y números)'
                : 'Código de 6 dígitos de tu aplicación'}
            </p>
          </div>

          <div className='flex gap-3'>
            <Button
              type='submit'
              disabled={
                isLoading ||
                (showBackupCode ? mfaToken.length !== 8 : mfaToken.length !== 6)
              }
              className='flex-1'
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className='mr-2 animate-spin'
                  />
                  Verificando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShield} className='mr-2' />
                  Verificar
                </>
              )}
            </Button>
          </div>
        </form>

        <div className='space-y-3'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-muted-foreground/20' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='bg-background px-2 text-muted-foreground'>
                ¿Problemas para acceder?
              </span>
            </div>
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={toggleBackupCode}
            className='w-full'
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faKey} className='mr-2' />
            {showBackupCode
              ? 'Usar código de aplicación'
              : 'Usar código de respaldo'}
          </Button>

          <Button
            type='button'
            variant='ghost'
            onClick={handleBack}
            className='w-full'
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faArrowLeft} className='mr-2' />
            Volver al inicio de sesión
          </Button>
        </div>

        <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
          <h4 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
            <FontAwesomeIcon icon={faShield} className='mr-2' />
            Consejos de seguridad
          </h4>
          <ul className='text-sm text-blue-800 dark:text-blue-400 space-y-1'>
            <li>• No compartas tus códigos con nadie</li>
            <li>• Los códigos de respaldo solo se pueden usar una vez</li>
            <li>• Si pierdes tu dispositivo, contacta al soporte</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
