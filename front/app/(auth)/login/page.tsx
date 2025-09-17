'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import CheckboxField from '@/components/forms/CheckboxField';
import { validateLogin, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Check for success message from registration
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'registration-success') {
      setSuccessMessage(
        '¡Registro exitoso! Ahora puedes iniciar sesión con tu cuenta.'
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

    // Clear any existing errors and success messages
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await login(validationResult.data);
      // Redirect is handled by AuthContext based on user role
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Hubo un problema al iniciar sesión. Por favor verifica tus datos e intenta de nuevo.';

      setErrors({
        general: errorMessage,
      });
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

  return (
    <AuthCard
      title='Bienvenido de vuelta'
      subtitle='Inicia sesión en tu cuenta para continuar'
      footerText='¿No tienes una cuenta?'
      footerLinkText='Regístrate aquí'
      footerLinkHref='/register'
    >
      <form className='space-y-6' onSubmit={handleSubmit} noValidate>
        {successMessage && (
          <div className='p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md'>
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className='p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md'>
            {errors.general}
          </div>
        )}

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
              href='#'
              className='font-medium text-primary hover:text-primary/80 underline'
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <AuthButton isLoading={isLoading} loadingText='Iniciando sesión...'>
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
    </AuthCard>
  );
}
