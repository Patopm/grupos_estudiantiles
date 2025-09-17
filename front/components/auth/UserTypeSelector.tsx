import React from 'react';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface UserTypeSelectorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UserTypeSelector({
  value,
  onChange,
}: UserTypeSelectorProps) {
  return (
    <div className='space-y-3'>
      <Label className='text-sm font-medium'>I want to join as:</Label>
      <div className='grid grid-cols-2 gap-3'>
        <label className='relative cursor-pointer'>
          <input
            type='radio'
            name='userType'
            value='student'
            checked={value === 'student'}
            onChange={onChange}
            className='sr-only'
          />
          <Card
            className={cn(
              'p-4 border-2 transition-colors hover:bg-accent/50',
              value === 'student'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className='text-center space-y-2'>
              <FontAwesomeIcon
                icon={faUser}
                className={cn(
                  'h-6 w-6',
                  value === 'student' ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div>
                <div className='text-sm font-medium'>Student</div>
                <div className='text-xs text-muted-foreground'>Join events</div>
              </div>
            </div>
          </Card>
        </label>
        <label className='relative cursor-pointer'>
          <input
            type='radio'
            name='userType'
            value='organizer'
            checked={value === 'organizer'}
            onChange={onChange}
            className='sr-only'
          />
          <Card
            className={cn(
              'p-4 border-2 transition-colors hover:bg-accent/50',
              value === 'organizer'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className='text-center space-y-2'>
              <FontAwesomeIcon
                icon={faCalendarAlt}
                className={cn(
                  'h-6 w-6',
                  value === 'organizer'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              />
              <div>
                <div className='text-sm font-medium'>Organizer</div>
                <div className='text-xs text-muted-foreground'>
                  Create events
                </div>
              </div>
            </div>
          </Card>
        </label>
      </div>
    </div>
  );
}
