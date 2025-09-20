'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import {
  AuthSuccessMessage,
  AuthErrorMessage,
} from '@/components/auth/AuthFormError';
import {
  validateForgotPassword,
  type ForgotPasswordFormData,
} from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using Zod
    const validationResult = validateForgotPassword(formData);

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear any existing errors
    setErrors({});
    setIsLoading(true);

    try {
      await requestPasswordReset(validationResult.data);
      setIsSuccess(true);
    } catch (error) {
      console.error('Password reset request error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Hubo un problema al procesar tu solicitud. Por favor intenta de nuevo.';

      setErrors({
        general: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;

    // Validate individual field on blur
    const fieldValidation = validateForgotPassword({
      [name]: formData[name as keyof ForgotPasswordFormData],
    });

    if (!fieldValidation.success && fieldValidation.errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldValidation.errors[name],
      }));
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  if (isSuccess) {
    return (
      <AuthCard
        title='Correo enviado'
        subtitle='Revisa tu bandeja de entrada'
        footerText='¿Recordaste tu contraseña?'
        footerLinkText='Volver al inicio de sesión'
        footerLinkHref='/login'
      >
        <div className='space-y-6'>
          <AuthSuccessMessage
            message={`Hemos enviado un enlace de restablecimiento de contraseña a ${formData.email}. Revisa tu bandeja de entrada y sigue las instrucciones para crear una nueva contraseña.`}
          />

          <div className='text-center space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Si no recibes el correo en los próximos minutos, revisa tu carpeta
              de spam o correo no deseado.
            </p>

            <AuthButton
              isLoading={false}
              loadingText=''
              type='button'
              onClick={handleBackToLogin}
              variant='outline'
            >
              Volver al inicio de sesión
            </AuthButton>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='¿Olvidaste tu contraseña?'
      subtitle='Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla'
      footerText='¿Recordaste tu contraseña?'
      footerLinkText='Volver al inicio de sesión'
      footerLinkHref='/login'
    >
      <form className='space-y-6' onSubmit={handleSubmit} noValidate>
        {errors.general && <AuthErrorMessage message={errors.general} />}

        <FormInput
          id='email'
          name='email'
          type='email'
          label='Correo Electrónico'
          placeholder='Ingresa tu email institucional'
          value={formData.email}
          error={errors.email}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='email'
          autoFocus
        />

        <div className='space-y-4'>
          <AuthButton isLoading={isLoading} loadingText='Enviando enlace...'>
            Enviar enlace de restablecimiento
          </AuthButton>

          <AuthButton
            isLoading={isLoading}
            loadingText=''
            type='button'
            onClick={handleBackToLogin}
            variant='outline'
            disabled={isLoading}
          >
            Cancelar
          </AuthButton>
        </div>
      </form>

      <div className='mt-6'>
        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-muted-foreground/20' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-background px-2 text-muted-foreground'>
              Restablecimiento seguro para cuentas de Tecmilenio
            </span>
          </div>
        </div>
      </div>
    </AuthCard>
  );
}
