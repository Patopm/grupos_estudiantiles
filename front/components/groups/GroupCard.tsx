'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Settings,
  UserPlus,
  UserMinus,
  Eye,
} from 'lucide-react';
import { Group } from '@/lib/api/groups';
import { useAuth } from '@/contexts/AuthContext';

interface GroupCardProps {
  group: Group;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onView?: (groupId: string) => void;
  onManage?: (groupId: string) => void;
  isLoading?: boolean;
}

export default function GroupCard({
  group,
  variant = 'default',
  showActions = true,
  onJoin,
  onLeave,
  onView,
  onManage,
}: GroupCardProps) {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isPresident =
    user?.role === 'president' && group.president_id === user.id;
  const isAdmin = user?.role === 'admin';
  const isMember = group.is_member;
  const isPending = group.membership_status === 'pending';

  const handleAction = async (action: () => void, actionType: string) => {
    setActionLoading(actionType);
    try {
      await action();
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Deportivo:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Cultural:
        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Académico:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Tecnológico:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      Social: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    };
    return (
      colors[category] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    );
  };

  const renderActions = () => {
    if (!showActions) return null;

    const actions = [];

    // View action (always available)
    if (onView) {
      actions.push(
        <Button
          key='view'
          variant='outline'
          size='sm'
          onClick={() => handleAction(() => onView(group.group_id), 'view')}
          disabled={actionLoading !== null}
          className='flex items-center gap-2'
        >
          <Eye className='w-4 h-4' />
          Ver Detalles
        </Button>
      );
    }

    // Management actions for president/admin
    if ((isPresident || isAdmin) && onManage) {
      actions.push(
        <Button
          key='manage'
          variant='default'
          size='sm'
          onClick={() => handleAction(() => onManage(group.group_id), 'manage')}
          disabled={actionLoading !== null}
          className='flex items-center gap-2'
        >
          <Settings className='w-4 h-4' />
          {actionLoading === 'manage' ? 'Cargando...' : 'Gestionar'}
        </Button>
      );
    }

    // Student actions
    if (user?.role === 'student') {
      if (isMember) {
        if (onLeave) {
          actions.push(
            <Button
              key='leave'
              variant='destructive'
              size='sm'
              onClick={() =>
                handleAction(() => onLeave(group.group_id), 'leave')
              }
              disabled={actionLoading !== null}
              className='flex items-center gap-2'
            >
              <UserMinus className='w-4 h-4' />
              {actionLoading === 'leave' ? 'Saliendo...' : 'Salir'}
            </Button>
          );
        }
      } else if (isPending) {
        actions.push(
          <Button
            key='pending'
            variant='secondary'
            size='sm'
            disabled
            className='flex items-center gap-2'
          >
            <Calendar className='w-4 h-4' />
            Solicitud Pendiente
          </Button>
        );
      } else {
        if (onJoin && group.member_count < group.max_members) {
          actions.push(
            <Button
              key='join'
              variant='default'
              size='sm'
              onClick={() => handleAction(() => onJoin(group.group_id), 'join')}
              disabled={actionLoading !== null}
              className='flex items-center gap-2'
            >
              <UserPlus className='w-4 h-4' />
              {actionLoading === 'join' ? 'Solicitando...' : 'Unirse'}
            </Button>
          );
        }
      }
    }

    return actions;
  };

  if (variant === 'compact') {
    return (
      <Card className='hover:shadow-md transition-shadow'>
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {group.image && (
              <div className='relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0'>
                <Image
                  src={group.image}
                  alt={group.name}
                  fill
                  className='object-cover'
                />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <div>
                  <h3 className='font-semibold text-sm truncate'>
                    {group.name}
                  </h3>
                  <p className='text-xs text-muted-foreground truncate'>
                    {group.president_name}
                  </p>
                </div>
                <Badge
                  className={`text-xs ${getCategoryColor(group.category)}`}
                >
                  {group.category}
                </Badge>
              </div>
              <div className='flex items-center gap-3 mt-2 text-xs text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Users className='w-3 h-3' />
                  <span>
                    {group.member_count}/{group.max_members}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {showActions && (
            <div className='flex gap-2 mt-3'>{renderActions()}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='hover:shadow-lg transition-shadow duration-200'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <h3 className='font-semibold text-lg truncate'>{group.name}</h3>
              <Badge className={getCategoryColor(group.category)}>
                {group.category}
              </Badge>
            </div>
            <p className='text-sm text-muted-foreground'>
              Presidente: {group.president_name}
            </p>
          </div>
        </div>
      </CardHeader>

      {group.image && (
        <div className='relative w-full h-48 overflow-hidden'>
          <Image
            src={group.image}
            alt={group.name}
            fill
            className='object-cover'
          />
        </div>
      )}

      <CardContent className='pt-4'>
        <p className='text-sm text-muted-foreground mb-4 line-clamp-3'>
          {group.description}
        </p>

        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1 text-muted-foreground'>
              <Users className='w-4 h-4' />
              <span>
                {group.member_count}/{group.max_members} miembros
              </span>
            </div>
            {isMember && (
              <Badge variant='secondary' className='text-xs'>
                Miembro
              </Badge>
            )}
            {isPending && (
              <Badge variant='outline' className='text-xs'>
                Pendiente
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className='pt-2'>
        <div className='flex gap-2 w-full'>{renderActions()}</div>
      </CardFooter>
    </Card>
  );
}
