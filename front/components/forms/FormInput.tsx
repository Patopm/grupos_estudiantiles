import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export default function FormInput({
  id,
  name,
  type,
  label,
  placeholder,
  value,
  error,
  required = false,
  autoComplete,
  autoFocus = false,
  onChange,
  onBlur,
}: FormInputProps) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id} className='text-sm font-medium'>
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        required={required}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}
