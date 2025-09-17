'use client';

import { useState } from 'react';
import AuthCard from '@/components/auth/AuthCard';
import FormInput from '@/components/forms/FormInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialLogin from '@/components/auth/SocialLogin';
import CheckboxField from '@/components/forms/CheckboxField';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: Implement actual authentication with backend
    console.log('Login attempt:', formData);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <AuthCard
      title='Welcome back'
      subtitle='Sign in to your account to continue'
      footerText="Don't have an account?"
      footerLinkText='Sign up here'
      footerLinkHref='/register'
    >
      <form className='space-y-6' onSubmit={handleSubmit}>
        <FormInput
          id='email'
          name='email'
          type='email'
          label='Email address'
          placeholder='Enter your email'
          value={formData.email}
          onChange={handleChange}
          autoComplete='email'
          required
        />

        <FormInput
          id='password'
          name='password'
          type='password'
          label='Password'
          placeholder='Enter your password'
          value={formData.password}
          onChange={handleChange}
          autoComplete='current-password'
          required
        />

        <div className='flex items-center justify-between'>
          <CheckboxField
            id='rememberMe'
            name='rememberMe'
            checked={formData.rememberMe}
            onChange={handleChange}
          >
            Remember me
          </CheckboxField>

          <div className='text-sm'>
            <a
              href='#'
              className='font-medium text-primary-600 dark:text-primary-400 hover:text-indigo-500 dark:hover:text-indigo-300'
            >
              Forgot your password?
            </a>
          </div>
        </div>

        <AuthButton isLoading={isLoading} loadingText='Signing in...'>
          Sign in
        </AuthButton>
      </form>

      <SocialLogin />
    </AuthCard>
  );
}
