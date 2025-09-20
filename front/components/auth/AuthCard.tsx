import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import AuthLoadingState from './AuthLoadingState';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
  isLoading = false,
  loadingMessage,
}: AuthCardProps) {
  return (
    <div className='space-y-6'>
      <Card className='shadow-lg'>
        <CardHeader className='space-y-1 text-center'>
          <CardTitle className='text-3xl font-bold'>{title}</CardTitle>
          <CardDescription className='text-base'>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {isLoading && loadingMessage ? (
            <AuthLoadingState message={loadingMessage} showCard={false} />
          ) : (
            children
          )}
        </CardContent>
      </Card>

      {/* Footer Link - Hidden during loading */}
      {!isLoading && (
        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            {footerText}{' '}
            <Link
              href={footerLinkHref}
              className='font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline'
              aria-label={`${footerLinkText} - navegar a ${footerLinkHref}`}
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
