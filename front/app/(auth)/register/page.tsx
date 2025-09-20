'use client';

import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import CheckboxField from '@/components/forms/CheckboxField';
import { AuthErrorMessage } from '@/components/auth/AuthFormError';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import {
  validateRegister,
  type RegisterFormData,
} from '@/lib/validations/auth';
import PasswordStrength from '@/components/auth/PasswordStrength';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form using Zod
    const validationResult = validateRegister(formData);

    if (!validationResult.success) {
      setErrors(validationResult.errors);
      return;
    }

    // Clear any existing errors
    setErrors({});
    setIsLoading(true);

    try {
      await register(validationResult.data);
      // Redirect is handled by AuthContext (goes to login page with success message)
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Hubo un problema al crear tu cuenta. Por favor verifica todos los datos e intenta de nuevo.';

      setErrors({
        general: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
    const fieldValidation = validateRegister({
      [name]: formData[name as keyof RegisterFormData],
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
      title='Registro de Estudiante'
      subtitle='Únete a la comunidad estudiantil de Tecmilenio'
      footerText='¿Ya tienes una cuenta?'
      footerLinkText='Inicia sesión aquí'
      footerLinkHref='/login'
    >
      <form className='space-y-6' onSubmit={handleSubmit} noValidate>
        {errors.general && <AuthErrorMessage message={errors.general} />}

        {/* Student Badge */}
        <div className='flex items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/20'>
          <FontAwesomeIcon
            icon={faUserGraduate}
            className='w-5 h-5 text-primary mr-2'
          />
          <span className='text-sm font-medium text-primary'>
            Registro como Estudiante
          </span>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <FormInput
            id='firstName'
            name='firstName'
            type='text'
            label='Nombre(s)'
            placeholder='Tu nombre'
            value={formData.firstName}
            error={errors.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
          />

          <FormInput
            id='lastName'
            name='lastName'
            type='text'
            label='Apellidos'
            placeholder='Tus apellidos'
            value={formData.lastName}
            error={errors.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <FormInput
          id='studentId'
          name='studentId'
          type='text'
          label='Matrícula'
          placeholder='Tu matrícula estudiantil'
          value={formData.studentId}
          error={errors.studentId}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='off'
        />

        <FormInput
          id='email'
          name='email'
          type='email'
          label='Correo Electrónico'
          placeholder='tu.email@tecmilenio.mx'
          value={formData.email}
          error={errors.email}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='email'
        />

        <FormInput
          id='phone'
          name='phone'
          type='tel'
          label='Teléfono'
          placeholder='10 dígitos'
          value={formData.phone}
          error={errors.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='tel'
        />

        <div className='space-y-2'>
          <FormInput
            id='password'
            name='password'
            type='password'
            label='Contraseña'
            placeholder='Crea una contraseña segura'
            value={formData.password}
            error={errors.password}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete='new-password'
          />
          <PasswordStrength password={formData.password} />
        </div>

        <FormInput
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          label='Confirmar Contraseña'
          placeholder='Confirma tu contraseña'
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete='new-password'
        />

        <CheckboxField
          id='agreeToTerms'
          name='agreeToTerms'
          checked={formData.agreeToTerms}
          error={errors.agreeToTerms}
          onChange={handleChange}
        >
          Acepto los{' '}
          <a className='text-primary hover:text-primary/80 underline'>
            Términos y Condiciones
          </a>{' '}
          y la{' '}
          <a className='text-primary hover:text-primary/80 underline'>
            Política de Privacidad
          </a>
        </CheckboxField>

        <AuthButton isLoading={isLoading} loadingText='Creando cuenta...'>
          Crear Cuenta de Estudiante
        </AuthButton>
      </form>
    </AuthCard>
  );
}
