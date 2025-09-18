import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface NotificationCheckboxProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function NotificationCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
}: NotificationCheckboxProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-start space-x-3'>
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={checkedState => {
            onChange(checkedState === true);
          }}
          className='mt-1'
        />
        <div className='space-y-1'>
          <Label
            htmlFor={id}
            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
          >
            {label}
          </Label>
          {description && (
            <p className='text-sm text-gray-600 leading-relaxed'>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
