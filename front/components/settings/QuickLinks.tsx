'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield } from '@fortawesome/free-solid-svg-icons';

export default function QuickLinks() {
  const quickLinks = [
    {
      title: 'Seguridad',
      description: 'Gestiona 2FA y configuración de seguridad',
      href: '/profile/security',
    },
    {
      title: 'Historial de Notificaciones',
      description: 'Ve tu historial completo de notificaciones',
      href: '/notifications',
    },
  ];

  return (
    <Card className='p-6'>
      <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-primary-text'>
        <FontAwesomeIcon icon={faShield} className='text-primary' />
        Enlaces Rápidos
      </h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {quickLinks.map((link, index) => (
          <Button
            key={index}
            variant='outline'
            className='justify-start h-auto p-4'
            onClick={() => (window.location.href = link.href)}
          >
            <div className='text-left'>
              <div className='font-medium'>{link.title}</div>
              <div className='text-sm text-gray-500'>{link.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}
