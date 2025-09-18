'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface SettingsToggleProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function SettingsToggle({
  id,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingsToggleProps) {
  return (
    <div className='flex items-center justify-between py-3'>
      <div className='flex-1'>
        <Label
          htmlFor={id}
          className='text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer'
        >
          {title}
        </Label>
        <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
          {description}
        </p>
      </div>

      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
