'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EmailVerificationConfirm from '@/components/auth/EmailVerificationConfirm';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <EmailVerificationConfirm
        token={token || undefined}
        onSuccess={() => {
          // Redirect will be handled by the component
        }}
        onError={error => {
          console.error('Email verification error:', error);
        }}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='max-w-md mx-auto p-6'>
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <Loader2 className='h-12 w-12 text-primary animate-spin' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-foreground'>
              Cargando Verificación
            </h3>
            <p className='text-sm text-muted-foreground'>
              Preparando la verificación de email...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
