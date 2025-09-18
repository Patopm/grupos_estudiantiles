'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  errorText?: string;
  icon?: IconDefinition;
  className?: string;
}

export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder,
  helpText,
  errorText,
  icon,
  className = '',
}: FormFieldProps) {
  const inputClassName = `
    ${disabled ? 'bg-gray-50 dark:bg-gray-800' : ''}
    ${errorText ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  return (
    <div className='space-y-2'>
      <Label
        htmlFor={id}
        className='text-sm font-medium text-gray-700 dark:text-gray-300'
      >
        {icon && (
          <FontAwesomeIcon icon={icon} className='mr-2 w-4 h-4 text-gray-500' />
        )}
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </Label>

      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={inputClassName}
      />

      {helpText && !errorText && (
        <p className='text-xs text-gray-500 dark:text-gray-400'>{helpText}</p>
      )}

      {errorText && (
        <p className='text-xs text-red-600 dark:text-red-400'>{errorText}</p>
      )}
    </div>
  );
}
