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
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { Group, GroupStatistics } from '@/lib/api/groups';
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
  statistics?: GroupStatistics;
  showStatistics?: boolean;
}

export default function GroupCard({
  group,
  variant = 'default',
  showActions = true,
  onJoin,
  onLeave,
  onView,
  onManage,
  statistics,
  showStatistics = false,
}: GroupCardProps) {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const isPresident =
    user?.role === 'president' && group.president_id === user.id;
  const isAdmin = user?.role === 'admin';
  const isMember = group.is_member;
  const isPending = group.membership_status === 'pending';
  const isGroupFull = group.member_count >= group.max_members;
  const canJoin = !isMember && !isPending && !isGroupFull && group.is_active;

  const handleAction = async (
    action: () => Promise<void> | void,
    actionType: string
  ) => {
    setActionLoading(actionType);

    // Set loading message for screen readers
    const loadingMessages: Record<string, string> = {
      join: 'Enviando solicitud para unirse al grupo...',
      leave: 'Procesando salida del grupo...',
      view: 'Cargando detalles del grupo...',
      manage: 'Accediendo a la gestión del grupo...',
    };

    setStatusMessage(loadingMessages[actionType] || 'Procesando...');

    try {
      await action();

      // Set success message
      const successMessages: Record<string, string> = {
        join: 'Solicitud enviada correctamente',
        leave: 'Has salido del grupo',
        view: 'Detalles del grupo cargados',
        manage: 'Acceso a gestión concedido',
      };

      setStatusMessage(successMessages[actionType] || 'Acción completada');

      // Clear message after a delay
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      console.error('Action failed:', error);
      setStatusMessage('Error al procesar la acción. Intenta de nuevo.');
      setTimeout(() => setStatusMessage(''), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Get membership status with enhanced indicators
  const getMembershipStatus = () => {
    if (isMember) {
      return {
        status: 'active',
        label: 'Miembro Activo',
        icon: CheckCircle,
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        ariaLabel: 'Eres miembro activo de este grupo',
      };
    }
    if (isPending) {
      return {
        status: 'pending',
        label: 'Solicitud Pendiente',
        icon: Clock,
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        ariaLabel: 'Tu solicitud de membresía está pendiente de aprobación',
      };
    }
    if (isGroupFull) {
      return {
        status: 'full',
        label: 'Grupo Lleno',
        icon: XCircle,
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        ariaLabel: 'Este grupo ha alcanzado su capacidad máxima',
      };
    }
    if (!group.is_active) {
      return {
        status: 'inactive',
        label: 'Grupo Inactivo',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        ariaLabel: 'Este grupo no está activo actualmente',
      };
    }
    return {
      status: 'available',
      label: 'Disponible',
      icon: UserPlus,
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ariaLabel: 'Puedes solicitar unirte a este grupo',
    };
  };

  // Get group capacity status with enhanced display
  const getCapacityStatus = () => {
    const percentage = (group.member_count / group.max_members) * 100;
    if (percentage >= 100) {
      return {
        level: 'full',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        percentage: 100,
        label: 'Grupo lleno',
      };
    }
    if (percentage >= 80) {
      return {
        level: 'high',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800',
        percentage: Math.round(percentage),
        label: 'Casi lleno',
      };
    }
    if (percentage >= 50) {
      return {
        level: 'medium',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        percentage: Math.round(percentage),
        label: 'Medio lleno',
      };
    }
    return {
      level: 'low',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      borderColor: 'border-green-200 dark:border-green-800',
      percentage: Math.round(percentage),
      label: 'Disponible',
    };
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
          className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
          aria-label={`Ver detalles del grupo ${group.name}`}
          aria-describedby={`group-${group.group_id}-description`}
        >
          <Eye className='w-4 h-4' aria-hidden='true' />
          {actionLoading === 'view' ? (
            <>
              <span
                className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                aria-hidden='true'
              />
              <span className='sr-only'>Cargando...</span>
            </>
          ) : (
            <>
              <span className='hidden sm:inline'>Ver Detalles</span>
              <span className='sm:hidden'>Ver</span>
            </>
          )}
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
          className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
          aria-label={`Gestionar grupo ${group.name}. Acceso a configuración, miembros y solicitudes`}
        >
          <Settings className='w-4 h-4' aria-hidden='true' />
          {actionLoading === 'manage' ? (
            <>
              <span
                className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                aria-hidden='true'
              />
              <span className='sr-only'>Cargando gestión...</span>
            </>
          ) : (
            <>
              <span className='hidden sm:inline'>Gestionar</span>
              <span className='sm:hidden'>Admin</span>
            </>
          )}
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
              className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95'
              aria-label={`Salir del grupo ${group.name}. Esta acción requerirá confirmación`}
              aria-describedby={`group-${group.group_id}-leave-warning`}
            >
              <UserMinus className='w-4 h-4' aria-hidden='true' />
              {actionLoading === 'leave' ? (
                <>
                  <span
                    className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                    aria-hidden='true'
                  />
                  <span className='sr-only'>Saliendo del grupo...</span>
                </>
              ) : (
                'Salir'
              )}
              <div
                id={`group-${group.group_id}-leave-warning`}
                className='sr-only'
              >
                Al salir del grupo perderás acceso a sus eventos y actividades
              </div>
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
            className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] cursor-not-allowed opacity-75'
            aria-label='Tu solicitud de membresía está pendiente de aprobación por el presidente del grupo'
            aria-describedby={`group-${group.group_id}-pending-info`}
          >
            <Clock className='w-4 h-4 animate-pulse' aria-hidden='true' />
            <span className='hidden sm:inline'>Solicitud Pendiente</span>
            <span className='sm:hidden'>Pendiente</span>
            <div
              id={`group-${group.group_id}-pending-info`}
              className='sr-only'
            >
              El presidente del grupo revisará tu solicitud pronto
            </div>
          </Button>
        );
      } else if (canJoin && onJoin) {
        actions.push(
          <Button
            key='join'
            variant='default'
            size='sm'
            onClick={() => handleAction(() => onJoin(group.group_id), 'join')}
            disabled={actionLoading !== null}
            className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] transition-all duration-200 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90'
            aria-label={`Solicitar unirse al grupo ${group.name}. Tu solicitud será revisada por el presidente`}
            aria-describedby={`group-${group.group_id}-join-info`}
          >
            <UserPlus className='w-4 h-4' aria-hidden='true' />
            {actionLoading === 'join' ? (
              <>
                <span
                  className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full'
                  aria-hidden='true'
                />
                <span className='sr-only'>Enviando solicitud...</span>
              </>
            ) : (
              'Unirse'
            )}
            <div id={`group-${group.group_id}-join-info`} className='sr-only'>
              El presidente del grupo revisará tu solicitud de membresía
            </div>
          </Button>
        );
      } else if (isGroupFull) {
        actions.push(
          <Button
            key='full'
            variant='secondary'
            size='sm'
            disabled
            className='flex items-center gap-2 touch-manipulation min-h-[44px] min-w-[44px] cursor-not-allowed opacity-75'
            aria-label='Este grupo ha alcanzado su capacidad máxima y no acepta nuevos miembros'
            aria-describedby={`group-${group.group_id}-full-info`}
          >
            <XCircle className='w-4 h-4 text-red-500' aria-hidden='true' />
            <span className='hidden sm:inline'>Grupo Lleno</span>
            <span className='sm:hidden'>Lleno</span>
            <div id={`group-${group.group_id}-full-info`} className='sr-only'>
              Este grupo tiene {group.member_count} de {group.max_members}{' '}
              miembros y no puede aceptar más solicitudes
            </div>
          </Button>
        );
      }
    }

    return actions;
  };

  // Render enhanced member count with visual progress
  const renderMemberCount = () => {
    const capacityStatus = getCapacityStatus();

    return (
      <div
        className={`flex items-center gap-2 p-2 rounded-lg ${capacityStatus.bgColor} ${capacityStatus.borderColor} border`}
        role='group'
        aria-label={`Información de membresía: ${group.member_count} de ${group.max_members} miembros, ${capacityStatus.label}`}
      >
        <Users
          className={`w-4 h-4 ${capacityStatus.color}`}
          aria-hidden='true'
        />
        <div className='flex-1'>
          <div className='flex items-center justify-between text-sm'>
            <span className={`font-medium ${capacityStatus.color}`}>
              {group.member_count}/{group.max_members}
            </span>
            <span className={`text-xs ${capacityStatus.color}`}>
              {capacityStatus.percentage}%
            </span>
          </div>
          <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1'>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                capacityStatus.level === 'full'
                  ? 'bg-red-500'
                  : capacityStatus.level === 'high'
                    ? 'bg-orange-500'
                    : capacityStatus.level === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
              }`}
              style={{ width: `${capacityStatus.percentage}%` }}
              role='progressbar'
              aria-valuenow={capacityStatus.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Capacidad del grupo: ${capacityStatus.percentage}% lleno`}
            />
          </div>
          <div className='text-xs text-muted-foreground mt-1'>
            {capacityStatus.label}
          </div>
        </div>
      </div>
    );
  };

  // Render group statistics
  const renderStatistics = () => {
    if (!showStatistics || !statistics) return null;

    return (
      <div className='grid grid-cols-2 gap-3 mt-3 p-3 bg-muted/50 rounded-lg'>
        <div className='flex items-center gap-2 text-sm'>
          <CheckCircle
            className='w-4 h-4 text-green-600 dark:text-green-400'
            aria-hidden='true'
          />
          <div>
            <div className='font-medium'>{statistics.activeMembers}</div>
            <div className='text-xs text-muted-foreground'>Activos</div>
          </div>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <Calendar
            className='w-4 h-4 text-blue-600 dark:text-blue-400'
            aria-hidden='true'
          />
          <div>
            <div className='font-medium'>{statistics.upcomingEvents}</div>
            <div className='text-xs text-muted-foreground'>Eventos</div>
          </div>
        </div>
        {statistics.totalEvents > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <TrendingUp
              className='w-4 h-4 text-purple-600 dark:text-purple-400'
              aria-hidden='true'
            />
            <div>
              <div className='font-medium'>{statistics.totalEvents}</div>
              <div className='text-xs text-muted-foreground'>Total eventos</div>
            </div>
          </div>
        )}
        {statistics.eventAttendanceRate > 0 && (
          <div className='flex items-center gap-2 text-sm'>
            <Users
              className='w-4 h-4 text-indigo-600 dark:text-indigo-400'
              aria-hidden='true'
            />
            <div>
              <div className='font-medium'>
                {Math.round(statistics.eventAttendanceRate)}
              </div>
              <div className='text-xs text-muted-foreground'>
                Asistencia prom.
              </div>
            </div>
          </div>
        )}
        {statistics.membershipGrowth > 0 && (
          <div className='flex items-center gap-2 text-sm col-span-2'>
            <TrendingUp className='w-4 h-4 text-green-600' aria-hidden='true' />
            <div>
              <div className='font-medium text-green-600'>
                +{statistics.membershipGrowth}%
              </div>
              <div className='text-xs text-muted-foreground'>Crecimiento</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (variant === 'compact') {
    const membershipStatus = getMembershipStatus();
    const capacityStatus = getCapacityStatus();
    const StatusIcon = membershipStatus.icon;

    return (
      <Card
        className='hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 group'
        role='article'
        aria-labelledby={`group-${group.group_id}-title`}
        aria-describedby={`group-${group.group_id}-description`}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onView) {
              onView(group.group_id);
            }
          }
        }}
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-3'>
            {group.image && (
              <div className='relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0'>
                <Image
                  src={group.image}
                  alt={`Imagen del grupo ${group.name}`}
                  fill
                  className='object-cover'
                />
              </div>
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1 min-w-0'>
                  <h3
                    id={`group-${group.group_id}-title`}
                    className='font-semibold text-sm truncate'
                  >
                    {group.name}
                  </h3>
                  <p
                    className='text-xs text-muted-foreground truncate'
                    aria-label={`Presidente: ${group.president_name}`}
                  >
                    {group.president_name}
                  </p>
                </div>
                <div className='flex flex-col gap-1 items-end'>
                  <Badge
                    className={`text-xs ${getCategoryColor(group.category)}`}
                    aria-label={`Categoría: ${group.category}`}
                  >
                    {group.category}
                  </Badge>
                  {(isMember || isPending || isGroupFull) && (
                    <Badge
                      className={`text-xs ${membershipStatus.color}`}
                      aria-label={membershipStatus.ariaLabel}
                    >
                      <StatusIcon className='w-3 h-3 mr-1' aria-hidden='true' />
                      {membershipStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className='mt-2'>
                <div className='flex items-center gap-2 text-xs'>
                  <div
                    className={`flex items-center gap-1 ${capacityStatus.color}`}
                    aria-label={`${group.member_count} de ${group.max_members} miembros, ${capacityStatus.percentage}% lleno`}
                  >
                    <Users className='w-3 h-3' aria-hidden='true' />
                    <span>
                      {group.member_count}/{group.max_members}
                    </span>
                    <span className='text-xs opacity-75'>
                      ({capacityStatus.percentage}%)
                    </span>
                  </div>
                  {showStatistics && statistics && (
                    <div
                      className='flex items-center gap-1 text-muted-foreground'
                      aria-label={`${statistics.upcomingEvents} eventos próximos`}
                    >
                      <Calendar className='w-3 h-3' aria-hidden='true' />
                      <span>{statistics.upcomingEvents}</span>
                    </div>
                  )}
                </div>
                {/* Mini progress bar for compact view */}
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1'>
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      capacityStatus.level === 'full'
                        ? 'bg-red-500'
                        : capacityStatus.level === 'high'
                          ? 'bg-orange-500'
                          : capacityStatus.level === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }`}
                    style={{ width: `${capacityStatus.percentage}%` }}
                    role='progressbar'
                    aria-valuenow={capacityStatus.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Capacidad del grupo: ${capacityStatus.percentage}% lleno`}
                  />
                </div>
              </div>
            </div>
          </div>
          <div id={`group-${group.group_id}-description`} className='sr-only'>
            {group.description}
          </div>
          {showActions && (
            <div
              className='flex flex-wrap gap-2 mt-3'
              role='group'
              aria-label='Acciones del grupo'
            >
              {renderActions()}
            </div>
          )}
          {renderStatistics()}
        </CardContent>

        {/* Live region for status announcements */}
        {statusMessage && (
          <div
            className='sr-only'
            role='status'
            aria-live='polite'
            aria-atomic='true'
          >
            {statusMessage}
          </div>
        )}
      </Card>
    );
  }

  const membershipStatus = getMembershipStatus();
  const StatusIcon = membershipStatus.icon;

  return (
    <Card
      className='hover:shadow-lg transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 group'
      role='article'
      aria-labelledby={`group-${group.group_id}-title`}
      aria-describedby={`group-${group.group_id}-description`}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onView) {
            onView(group.group_id);
          }
        }
      }}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-3'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start gap-2 mb-2'>
              <h3
                id={`group-${group.group_id}-title`}
                className='font-semibold text-lg truncate flex-1'
              >
                {group.name}
              </h3>
              <div className='flex flex-col gap-1 items-end'>
                <Badge
                  className={getCategoryColor(group.category)}
                  aria-label={`Categoría: ${group.category}`}
                >
                  {group.category}
                </Badge>
                {(isMember || isPending || isGroupFull || !group.is_active) && (
                  <Badge
                    className={`text-xs ${membershipStatus.color}`}
                    aria-label={membershipStatus.ariaLabel}
                  >
                    <StatusIcon className='w-3 h-3 mr-1' aria-hidden='true' />
                    {membershipStatus.label}
                  </Badge>
                )}
              </div>
            </div>
            <p
              className='text-sm text-muted-foreground'
              aria-label={`Presidente: ${group.president_name}`}
            >
              Presidente: {group.president_name}
            </p>
          </div>
        </div>
      </CardHeader>

      {group.image && (
        <div className='relative w-full h-48 overflow-hidden'>
          <Image
            src={group.image}
            alt={`Imagen del grupo ${group.name}`}
            fill
            className='object-cover'
          />
        </div>
      )}

      <CardContent className='pt-4'>
        <p
          id={`group-${group.group_id}-description`}
          className='text-sm text-muted-foreground mb-4 line-clamp-3'
        >
          {group.description}
        </p>

        {/* Enhanced member count display */}
        <div className='mb-4'>{renderMemberCount()}</div>

        {/* Quick stats for default view */}
        {showStatistics && statistics && (
          <div className='flex items-center gap-4 text-sm mb-4'>
            <div
              className='flex items-center gap-1 text-muted-foreground'
              aria-label={`${statistics.activeMembers} miembros activos`}
            >
              <CheckCircle className='w-4 h-4' aria-hidden='true' />
              <span>{statistics.activeMembers} activos</span>
            </div>
            <div
              className='flex items-center gap-1 text-muted-foreground'
              aria-label={`${statistics.upcomingEvents} eventos próximos`}
            >
              <Calendar className='w-4 h-4' aria-hidden='true' />
              <span>{statistics.upcomingEvents} eventos</span>
            </div>
          </div>
        )}

        {renderStatistics()}
      </CardContent>

      <CardFooter className='pt-2'>
        <div
          className='flex flex-wrap gap-2 w-full'
          role='group'
          aria-label='Acciones del grupo'
        >
          {renderActions()}
        </div>
      </CardFooter>

      {/* Live region for status announcements */}
      {statusMessage && (
        <div
          className='sr-only'
          role='status'
          aria-live='polite'
          aria-atomic='true'
        >
          {statusMessage}
        </div>
      )}
    </Card>
  );
}
