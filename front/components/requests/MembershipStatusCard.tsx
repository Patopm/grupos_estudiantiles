'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MembershipStatusCardProps {
  membership: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    role: 'member' | 'president';
    status: 'pending' | 'active' | 'inactive';
    joined_at: string;
    group_name: string;
    group_id: string;
  };
  onViewGroup?: (groupId: string) => void;
  showViewButton?: boolean;
}

export default function MembershipStatusCard({
  membership,
  onViewGroup,
  showViewButton = true,
}: MembershipStatusCardProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendiente',
          color:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          icon: Clock,
          description:
            'Tu solicitud está siendo revisada por el presidente del grupo',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        };
      case 'active':
        return {
          label: 'Activo',
          color:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          icon: CheckCircle,
          description: 'Eres miembro activo de este grupo',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        };
      case 'inactive':
        return {
          label: 'Inactivo',
          color:
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: XCircle,
          description: 'Ya no eres miembro de este grupo',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        };
      default:
        return {
          label: 'Desconocido',
          color:
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
          icon: AlertCircle,
          description: 'Estado de membresía desconocido',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        };
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'president':
        return {
          label: 'Presidente',
          color:
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          icon: Users,
        };
      case 'member':
        return {
          label: 'Miembro',
          color:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: User,
        };
      default:
        return {
          label: 'Miembro',
          color:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: User,
        };
    }
  };

  const statusInfo = getStatusInfo(membership.status);
  const roleInfo = getRoleInfo(membership.role);
  const StatusIcon = statusInfo.icon;
  const RoleIcon = roleInfo.icon;

  const handleViewGroup = () => {
    if (onViewGroup) {
      onViewGroup(membership.group_id);
    }
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${statusInfo.bgColor}`}
    >
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                membership.status === 'pending'
                  ? 'bg-yellow-100 dark:bg-yellow-900'
                  : membership.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'bg-gray-100 dark:bg-gray-900'
              }`}
            >
              <StatusIcon
                className={`w-6 h-6 ${
                  membership.status === 'pending'
                    ? 'text-yellow-600'
                    : membership.status === 'active'
                      ? 'text-green-600'
                      : 'text-gray-600'
                }`}
              />
            </div>
            <div>
              <h4 className='font-medium'>{membership.group_name}</h4>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Calendar className='w-4 h-4' />
                  {formatDistanceToNow(new Date(membership.joined_at), {
                    addSuffix: true,
                    locale: es,
                  })}
                </div>
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {statusInfo.description}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Badge className={`text-xs ${statusInfo.color}`}>
              <StatusIcon className='w-3 h-3 mr-1' />
              {statusInfo.label}
            </Badge>
            <Badge variant='outline' className='text-xs'>
              <RoleIcon className='w-3 h-3 mr-1' />
              {roleInfo.label}
            </Badge>
            {showViewButton && membership.status === 'active' && (
              <Button size='sm' variant='outline' onClick={handleViewGroup}>
                <Eye className='w-4 h-4 mr-1' />
                Ver Grupo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


