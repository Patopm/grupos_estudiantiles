'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthFormWrapper from '@/components/auth/AuthFormWrapper';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import CheckboxField from '@/components/forms/CheckboxField';
import MFAInput from '@/components/auth/MFAInput';
import {
  AuthSuccessMessage,
  AuthErrorMessage,
} from '@/components/auth/AuthFormError';
import { validateLogin, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthError } from '@/hooks/useAuthError';
import { ProgressiveSecurityManager } from '@/lib/errors/security';

export default function LoginPage() {
  const { login, mfaRequired, clearMFAState } = useAuth();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Enhanced error handling
  const {
    error: authError,
    executeWithErrorHandling,
    clearError,
  } = useAuthError({
    enableRetry: true,
    onRecovery: () => {
      setErrors({});
      setIsLoading(false);
    },
  });

  // Check for success message from registration or password reset
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'registration-success') {
      setSuccessMessage(
        '¡Registro exitoso! Ahora puedes iniciar sesión con tu cuenta.'
      );
    } else if (message === 'password-reset-success') {
      setSuccessMessage(
        '¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.'
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using Zod
    const validationResult = validateLogin(formData);

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    // Check security state before attempting login
    const securityCheck = ProgressiveSecurityManager.canAttemptAuth();
    if (!securityCheck.allowed) {
      setErrors({
        general:
          securityCheck.reason ||
          'No se puede intentar iniciar sesión en este momento.',
      });
      return;
    }

    // Clear any existing errors and success messages
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await executeWithErrorHandling(
        () => login(validationResult.data),
        'authentication'
      );
      // Redirect is handled by AuthContext based on user role
    } catch (error) {
      console.error('Login error:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('MFA')) {
          // MFA error is handled by the MFA component
          return;
        }

        setErrors({
          general: error.message,
        });
      } else {
        setErrors({
          general:
            'Hubo un problema al iniciar sesión. Por favor verifica tus datos e intenta de nuevo.',
        });
      }

      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }

    // Clear auth error when user starts typing
    if (authError) {
      clearError();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;

    // Validate individual field on blur
    const fieldValidation = validateLogin({
      [name]: formData[name as keyof LoginFormData],
    });

    if (!fieldValidation.success && fieldValidation.errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldValidation.errors[name],
      }));
    }
  };

  const handleBackFromMFA = () => {
    clearMFAState();
    setErrors({});
    setSuccessMessage('');
    clearError();
  };

  const handleErrorDismiss = () => {
    clearError();
    setErrors({});
  };

  // Show MFA input if MFA is required
  if (mfaRequired) {
    return <MFAInput onBack={handleBackFromMFA} />;
  }

  return (
    <AuthFormWrapper
      title='Bienvenido de vuelta'
      subtitle='Inicia sesión en tu cuenta para continuar'
      footerText='¿No tienes una cuenta?'
      footerLinkText='Regístrate aquí'
      footerLinkHref='/register'
      isLoading={isLoading}
      loadingMessage='Iniciando sesión...'
      error={authError}
      onErrorDismiss={handleErrorDismiss}
      enableRetry={true}
      showSecurityMeasures={true}
    >
      <form className='space-y-6' onSubmit={handleSubmit} noValidate>
        {successMessage && <AuthSuccessMessage message={successMessage} />}

        {errors.general && <AuthErrorMessage message={errors.general} />}

        <FormInput
          id='email'
          name='email'
          type='email'
          label='Correo Electrónico'
          placeholder='Ingresa tu email'
          value={formData.email}
          error={errors.email}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='email'
        />

        <FormInput
          id='password'
          name='password'
          type='password'
          label='Contraseña'
          placeholder='Ingresa tu contraseña'
          value={formData.password}
          error={errors.password}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='current-password'
        />

        <div className='flex items-center justify-between'>
          <CheckboxField
            id='rememberMe'
            name='rememberMe'
            checked={formData.rememberMe}
            onChange={handleChange}
          >
            Recordarme
          </CheckboxField>

          <div className='text-sm'>
            <a
              href='/forgot-password'
              className='font-medium text-primary hover:text-primary/80 underline'
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <AuthButton
          isLoading={isLoading}
          loadingText='Iniciando sesión...'
          disabled={isLoading || !!authError}
        >
          Iniciar Sesión
        </AuthButton>
      </form>

      <div className='mt-6'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-muted-foreground/20' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-background px-2 text-muted-foreground'>
              Acceso para estudiantes, presidentes y administradores
            </span>
          </div>
        </div>
      </div>
    </AuthFormWrapper>
  );
}
