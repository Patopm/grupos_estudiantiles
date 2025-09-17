import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CheckboxFieldProps {
  id: string;
  name: string;
  checked: boolean;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}

export default function CheckboxField({
  id,
  name,
  checked,
  error,
  onChange,
  children,
}: CheckboxFieldProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-start space-x-2'>
        <Checkbox
          id={id}
          name={name}
          checked={checked}
          onCheckedChange={checkedState => {
            // Convert the shadcn checkbox event to a regular input event
            const syntheticEvent = {
              target: {
                name,
                type: 'checkbox',
                checked: checkedState === true,
              },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }}
          className='mt-0.5'
        />
        <Label
          htmlFor={id}
          className='text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          {children}
        </Label>
      </div>
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}
