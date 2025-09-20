'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import PasswordStrength from '@/components/auth/PasswordStrength';
import {
  AuthSuccessMessage,
  AuthErrorMessage,
} from '@/components/auth/AuthFormError';
import {
  validateResetPassword,
  type ResetPasswordFormData,
} from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string>('');
  const [uid, setUid] = useState<string>('');
  const [isValidLink, setIsValidLink] = useState(true);

  // Extract token and uid from URL parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const uidParam = searchParams.get('uid');

    if (!tokenParam || !uidParam) {
      setIsValidLink(false);
      return;
    }

    setToken(tokenParam);
    setUid(uidParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidLink || !token || !uid) {
      setErrors({
        general: 'El enlace de restablecimiento es inválido o ha expirado.',
      });
      return;
    }

    // Validate form using Zod
    const validationResult = validateResetPassword(formData);

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear any existing errors
    setErrors({});
    setIsLoading(true);

    try {
      await resetPassword(token, uid, validationResult.data);
      setIsSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Hubo un problema al restablecer tu contraseña. Por favor intenta de nuevo.';

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
    const fieldValidation = validateResetPassword({
      [name]: formData[name as keyof ResetPasswordFormData],
    });

    if (!fieldValidation.success && fieldValidation.errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: fieldValidation.errors[name],
      }));
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login?message=password-reset-success');
  };

  if (!isValidLink) {
    return (
      <AuthCard
        title='Enlace inválido'
        subtitle='El enlace de restablecimiento no es válido'
        footerText='¿Necesitas ayuda?'
        footerLinkText='Solicitar nuevo enlace'
        footerLinkHref='/forgot-password'
      >
        <div className='space-y-6'>
          <AuthErrorMessage message='El enlace de restablecimiento de contraseña es inválido o ha expirado. Por favor solicita un nuevo enlace.' />

          <div className='text-center space-y-4'>
            <AuthButton
              isLoading={false}
              loadingText=''
              type='button'
              onClick={() => router.push('/forgot-password')}
            >
              Solicitar nuevo enlace
            </AuthButton>

            <AuthButton
              isLoading={false}
              loadingText=''
              type='button'
              onClick={() => router.push('/login')}
              variant='outline'
            >
              Volver al inicio de sesión
            </AuthButton>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (isSuccess) {
    return (
      <AuthCard
        title='¡Contraseña restablecida!'
        subtitle='Tu contraseña ha sido actualizada exitosamente'
        footerText='¿Listo para continuar?'
        footerLinkText='Iniciar sesión'
        footerLinkHref='/login'
      >
        <div className='space-y-6'>
          <AuthSuccessMessage message='Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.' />

          <div className='text-center'>
            <AuthButton
              isLoading={false}
              loadingText=''
              type='button'
              onClick={handleLoginRedirect}
            >
              Iniciar sesión
            </AuthButton>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title='Crear nueva contraseña'
      subtitle='Ingresa tu nueva contraseña para completar el restablecimiento'
      footerText='¿Recordaste tu contraseña?'
      footerLinkText='Volver al inicio de sesión'
      footerLinkHref='/login'
    >
      <form className='space-y-6' onSubmit={handleSubmit} noValidate>
        {errors.general && <AuthErrorMessage message={errors.general} />}

        <FormInput
          id='password'
          name='password'
          type='password'
          label='Nueva Contraseña'
          placeholder='Crea una contraseña segura'
          value={formData.password}
          error={errors.password}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='new-password'
          autoFocus
        />

        {formData.password && <PasswordStrength password={formData.password} />}

        <FormInput
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          label='Confirmar Nueva Contraseña'
          placeholder='Confirma tu nueva contraseña'
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='new-password'
        />

        <AuthButton
          isLoading={isLoading}
          loadingText='Restableciendo contraseña...'
        >
          Restablecer contraseña
        </AuthButton>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
