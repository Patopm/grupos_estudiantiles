'use client';

import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import CheckboxField from '@/components/forms/CheckboxField';
import { validateLogin, type LoginFormData } from '@/lib/validations/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using Zod
    const validationResult = validateLogin(formData);

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear any existing errors
    setErrors({});
    setIsLoading(true);

    try {
      // TODO: Implement actual authentication with backend
      console.log('Login attempt:', validationResult.data);

      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        // TODO: Redirect to dashboard based on user role
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general:
          'Hubo un problema al iniciar sesión. Por favor verifica tus datos e intenta de nuevo.',
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
