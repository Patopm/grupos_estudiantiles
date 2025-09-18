'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faTachometerAlt,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

interface PageHeaderProps {
  title: string;
  description: string;
  backUrl: string;
  backLabel?: string;
  showDashboardButton?: boolean;
  icon?: IconDefinition;
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  backUrl,
  backLabel = 'Volver al Dashboard',
  showDashboardButton = true,
  icon,
  children,
}: PageHeaderProps) {
  return (
    <div className='mb-6'>
      {/* Breadcrumb Navigation */}
      <div className='mb-4'>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={backUrl} className='flex items-center gap-2'>
                  <FontAwesomeIcon icon={faArrowLeft} className='w-4 h-4' />
                  {backLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Content */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3'>
            {icon && (
              <FontAwesomeIcon icon={icon} className='text-primary text-2xl' />
            )}
            {title}
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>{description}</p>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-3'>
          {children}
          {showDashboardButton && (
            <Link href={backUrl}>
              <Button variant='outline' className='flex items-center gap-2'>
                <FontAwesomeIcon icon={faTachometerAlt} className='w-4 h-4' />
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
