'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import UserMenu from '@/components/dashboard/UserMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface DashboardHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backUrl?: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  description,
  breadcrumbs = [],
  showBackButton = false,
  backUrl,
  actions,
}: DashboardHeaderProps) {
  const { user } = useAuth();

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/dashboard/student';
    switch (user.role) {
      case 'admin':
        return '/dashboard/admin';
      case 'president':
        return '/dashboard/president';
      case 'student':
      default:
        return '/dashboard/student';
    }
  };

  // Get dashboard title based on user role
  const getDashboardTitle = () => {
    if (!user) return 'Dashboard';
    switch (user.role) {
      case 'admin':
        return 'Dashboard Administrador';
      case 'president':
        return 'Dashboard Presidente';
      case 'student':
      default:
        return 'Dashboard Estudiante';
    }
  };

  // Build default breadcrumbs with dashboard as root
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    {
      label: getDashboardTitle(),
      href: getDashboardUrl(),
    },
  ];

  // Combine default breadcrumbs with provided ones
  const allBreadcrumbs = [...defaultBreadcrumbs, ...breadcrumbs];

  return (
    <header className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='px-6 py-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Top Navigation Bar */}
          <div className='flex justify-between items-center mb-4'>
            <div className='flex items-center gap-4'>
              {/* Back Button */}
              {showBackButton && (
                <Link href={backUrl || getDashboardUrl()}>
                  <Button variant='ghost' size='sm' className='gap-2'>
                    <FontAwesomeIcon icon={faArrowLeft} className='w-4 h-4' />
                    Volver
                  </Button>
                </Link>
              )}
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>

          {/* Breadcrumbs */}
          {allBreadcrumbs.length > 0 && (
            <div className='mb-4'>
              <Breadcrumb>
                <BreadcrumbList>
                  {allBreadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {crumb.current ||
                        index === allBreadcrumbs.length - 1 ? (
                          <BreadcrumbPage className='font-medium'>
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href || '#'}>
                            <div className='flex items-center gap-2'>
                              {index === 0 && (
                                <FontAwesomeIcon
                                  icon={faTachometerAlt}
                                  className='w-3 h-3'
                                />
                              )}
                              {crumb.label}
                            </div>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}

          {/* Header Content */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                {title}
              </h1>
              {description && (
                <p className='text-muted-foreground'>{description}</p>
              )}
            </div>

            {/* Custom Actions */}
            {actions && (
              <div className='flex items-center gap-2'>{actions}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Helper component for common dashboard layouts
interface DashboardLayoutProps {
  header: React.ComponentProps<typeof DashboardHeader>;
  children: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  header,
  children,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader {...header} />
      <main className={`max-w-7xl mx-auto p-6 ${className}`}>{children}</main>
    </div>
  );
}

// Pre-configured header variants for common use cases
export const DashboardHeaders = {
  // Profile page header
  profile: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Mi Perfil',
    description: 'Gestiona tu información personal y configuraciones de cuenta',
    breadcrumbs: [{ label: 'Perfil', current: true }],
    showBackButton: true,
    ...props,
  }),

  // Settings page header
  settings: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Configuración',
    description: 'Personaliza tu experiencia en la plataforma',
    breadcrumbs: [{ label: 'Configuración', current: true }],
    showBackButton: true,
    ...props,
  }),

  // Security page header
  security: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Configuración de Seguridad',
    description:
      'Gestiona la seguridad de tu cuenta y las preferencias de notificación',
    breadcrumbs: [
      { label: 'Perfil', href: '/profile' },
      { label: 'Seguridad', current: true },
    ],
    showBackButton: true,
    backUrl: '/profile',
    ...props,
  }),

  // Notifications page header
  notifications: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Historial de Notificaciones',
    description:
      'Revisa todas las notificaciones y recordatorios enviados a tu cuenta',
    breadcrumbs: [{ label: 'Notificaciones', current: true }],
    showBackButton: true,
    ...props,
  }),

  // Groups page header
  groups: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Grupos Estudiantiles',
    description: 'Gestiona y explora grupos estudiantiles',
    breadcrumbs: [{ label: 'Grupos', current: true }],
    showBackButton: true,
    ...props,
  }),

  // Events page header
  events: (props?: Partial<DashboardHeaderProps>) => ({
    title: 'Eventos',
    description: 'Próximos eventos y actividades',
    breadcrumbs: [{ label: 'Eventos', current: true }],
    showBackButton: true,
    ...props,
  }),
};
