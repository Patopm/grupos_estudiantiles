'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faChevronDown,
  faBell,
  faCog,
  faShield,
  faSignOutAlt,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';

export default function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex items-center gap-2 px-3 py-2 h-auto'
        >
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
              <FontAwesomeIcon
                icon={faUserCircle}
                className='text-primary text-lg'
              />
            </div>
            <div className='flex flex-col items-start'>
              <span className='text-sm font-medium'>
                {user.first_name} {user.last_name}
              </span>
              <span className='text-xs text-muted-foreground capitalize'>
                {user.role_display}
              </span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className='text-muted-foreground text-xs'
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {user.first_name} {user.last_name}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Link href='/profile' className='flex items-center gap-2 w-full'>
            <FontAwesomeIcon icon={faUser} className='w-4 h-4' />
            <span>Mi Perfil</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link
            href='/notifications'
            className='flex items-center gap-2 w-full'
          >
            <FontAwesomeIcon icon={faBell} className='w-4 h-4' />
            <span>Notificaciones</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link
            href='/profile/security'
            className='flex items-center gap-2 w-full'
          >
            <FontAwesomeIcon icon={faShield} className='w-4 h-4' />
            <span>Seguridad</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href='/settings' className='flex items-center gap-2 w-full'>
            <FontAwesomeIcon icon={faCog} className='w-4 h-4' />
            <span>Configuración</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={logout}>
          <div className='flex items-center gap-2 w-full text-red-600'>
            <FontAwesomeIcon icon={faSignOutAlt} className='w-4 h-4' />
            <span>Cerrar Sesión</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
