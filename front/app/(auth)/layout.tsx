import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthGroupLayout({ children }: AuthLayoutProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center px-4 py-8'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <Link
            href='/'
            className='text-3xl font-bold text-primary hover:text-primary/80 transition-colors'
          >
            EventHub
          </Link>
        </div>

        {children}
      </div>
    </div>
  );
}
