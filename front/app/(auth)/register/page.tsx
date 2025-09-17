'use client';

import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import UserTypeSelector from '@/components/auth/UserTypeSelector';
import CheckboxField from '@/components/forms/CheckboxField';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'student', // 'student' or 'organizer'
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // TODO: Implement actual registration with backend
    console.log('Registration attempt:', formData);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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

  return (
    <AuthCard
      title='Create your account'
      subtitle='Join EventHub and start managing events'
      footerText='Already have an account?'
      footerLinkText='Sign in here'
      footerLinkHref='/login'
    >
      <form className='space-y-6' onSubmit={handleSubmit}>
        <UserTypeSelector value={formData.userType} onChange={handleChange} />

        <div className='grid grid-cols-2 gap-4'>
          <FormInput
            id='firstName'
            name='firstName'
            type='text'
            label='First name'
            placeholder='First name'
            value={formData.firstName}
            error={errors.firstName}
            onChange={handleChange}
            required
          />

          <FormInput
            id='lastName'
            name='lastName'
            type='text'
            label='Last name'
            placeholder='Last name'
            value={formData.lastName}
            error={errors.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <FormInput
          id='email'
          name='email'
          type='email'
          label='Email address'
          placeholder='Enter your email'
          value={formData.email}
          error={errors.email}
          onChange={handleChange}
          autoComplete='email'
          required
        />

        <FormInput
          id='password'
          name='password'
          type='password'
          label='Password'
          placeholder='Create a password'
          value={formData.password}
          error={errors.password}
          onChange={handleChange}
          autoComplete='new-password'
          required
        />

        <FormInput
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          label='Confirm password'
          placeholder='Confirm your password'
          value={formData.confirmPassword}
          error={errors.confirmPassword}
          onChange={handleChange}
          autoComplete='new-password'
          required
        />

        <CheckboxField
          id='agreeToTerms'
          name='agreeToTerms'
          checked={formData.agreeToTerms}
          error={errors.agreeToTerms}
          onChange={handleChange}
        >
          I agree to the{' '}
          <a
            href='#'
            className='text-primary-600 dark:text-primary-400 hover:text-indigo-500 dark:hover:text-indigo-300'
          >
            Terms and Conditions
          </a>{' '}
          and{' '}
          <a
            href='#'
            className='text-primary-600 dark:text-primary-400 hover:text-indigo-500 dark:hover:text-indigo-300'
          >
            Privacy Policy
          </a>
        </CheckboxField>

        <AuthButton isLoading={isLoading} loadingText='Creating account...'>
          Create account
        </AuthButton>
      </form>
    </AuthCard>
  );
}
