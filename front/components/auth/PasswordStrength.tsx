'use client';

import { checkPasswordStrength } from '@/lib/validations/auth';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export default function PasswordStrength({
  password,
  className,
}: PasswordStrengthProps) {
  if (!password) return null;

  const { score, feedback, isStrong } = checkPasswordStrength(password);

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Muy débil';
    if (score <= 2) return 'Débil';
    if (score <= 3) return 'Regular';
    if (score <= 4) return 'Buena';
    return 'Excelente';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Fortaleza:</span>
        <div className='flex-1 flex gap-1'>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full flex-1 transition-colors',
                i < score ? getStrengthColor(score) : 'bg-muted'
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            isStrong ? 'text-green-600' : 'text-orange-600'
          )}
        >
          {getStrengthText(score)}
        </span>
      </div>

      {feedback.length > 0 && (
        <div className='space-y-1'>
          {feedback.map((item, index) => (
            <div
              key={index}
              className='text-xs text-muted-foreground flex items-center gap-1'
            >
              <span className='w-1 h-1 bg-muted-foreground rounded-full' />
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
