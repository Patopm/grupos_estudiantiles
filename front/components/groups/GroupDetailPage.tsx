'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  UserPlus,
  UserMinus,
  MapPin,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { GroupDetailData } from '@/lib/api/groups';
import { Event } from '@/lib/api/events';
import GroupDetailSkeleton from './GroupDetailSkeleton';
import ConfirmationDialog from './ConfirmationDialog';

interface GroupDetailPageProps {
  groupData: GroupDetailData | null;
  isLoading: boolean;
  error: string | null;
  onJoin: () => Promise<void>;
  onLeave: () => Promise<void>;
  onBack: () => void;
  onRetry: () => void;
}

export default function GroupDetailPage({
  groupData,
  isLoading,
  error,
  onJoin,
  onLeave,
  onBack,
  onRetry,
}: GroupDetailPageProps) {
  const { user } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Cargando...'
          description='Obteniendo información del grupo'
          showBackButton
          backUrl='/dashboard/student/groups'
          breadcrumbs={[
            { label: 'Grupos', href: '/dashboard/student/groups' },
            { label: 'Detalles', current: true },
          ]}
        />
        <div className='max-w-7xl mx-auto p-6'>
          <GroupDetailSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !groupData) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Error'
          description='No se pudo cargar la información del grupo'
          showBackButton
          backUrl='/dashboard/student/groups'
          breadcrumbs={[
            { label: 'Grupos', href: '/dashboard/student/groups' },
            { label: 'Error', current: true },
          ]}
        />
        <div className='max-w-7xl mx-auto p-6'>
          <Card className='max-w-md mx-auto'>
            <CardContent className='pt-6'>
              <div className='text-center space-y-4'>
                <AlertCircle className='w-12 h-12 text-destructive mx-auto' />
                <div>
                  <h3 className='text-lg font-semibold'>
                    Error al cargar el grupo
                  </h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {error || 'Ocurrió un error inesperado'}
                  </p>
                </div>
                <div className='flex gap-2 justify-center'>
                  <Button onClick={onRetry} variant='default' className='gap-2'>
                    <RefreshCw className='w-4 h-4' />
                    Reintentar
                  </Button>
                  <Button onClick={onBack} variant='outline' className='gap-2'>
                    <ArrowLeft className='w-4 h-4' />
                    Volver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isMember = groupData.is_member;
  const isPending = groupData.membership_status === 'pending';
  const isGroupFull = groupData.member_count >= groupData.max_members;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleJoinClick = () => {
    setShowJoinDialog(true);
  };

  const handleLeaveClick = () => {
    setShowLeaveDialog(true);
  };

  const handleConfirmJoin = async () => {
    setActionLoading('join');
    try {
      await onJoin();
    } finally {
      setActionLoading(null);
      setShowJoinDialog(false);
    }
  };

  const handleConfirmLeave = async () => {
    setActionLoading('leave');
    try {
      await onLeave();
    } finally {
      setActionLoading(null);
      setShowLeaveDialog(false);
    }
  };

  const renderActionButton = () => {
    if (user?.role !== 'student') return null;

    if (isMember) {
      return (
        <Button
          onClick={handleLeaveClick}
          variant='destructive'
          size='lg'
          disabled={actionLoading !== null}
          className='gap-2'
        >
          <UserMinus className='w-4 h-4' />
          {actionLoading === 'leave' ? 'Saliendo...' : 'Salir del Grupo'}
        </Button>
      );
    }

    if (isPending) {
      return (
        <Button variant='secondary' size='lg' disabled className='gap-2'>
          <Clock className='w-4 h-4' />
          Solicitud Pendiente
        </Button>
      );
    }

    if (isGroupFull) {
      return (
        <Button variant='outline' size='lg' disabled className='gap-2'>
          <Users className='w-4 h-4' />
          Grupo Lleno
        </Button>
      );
    }

    return (
      <Button
        onClick={handleJoinClick}
        variant='default'
        size='lg'
        disabled={actionLoading !== null}
        className='gap-2'
      >
        <UserPlus className='w-4 h-4' />
        {actionLoading === 'join' ? 'Solicitando...' : 'Unirse al Grupo'}
      </Button>
    );
  };

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={groupData.name}
        description={`Grupo ${groupData.category} • ${groupData.member_count}/${groupData.max_members} miembros`}
        showBackButton
        backUrl='/dashboard/student/groups'
        breadcrumbs={[
          { label: 'Grupos', href: '/dashboard/student/groups' },
          { label: groupData.name, current: true },
        ]}
        actions={renderActionButton()}
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Group Header Card */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col lg:flex-row gap-6'>
              {/* Group Image */}
              {groupData.image && (
                <div className='relative w-full lg:w-64 h-48 lg:h-64 rounded-lg overflow-hidden flex-shrink-0'>
                  <Image
                    src={groupData.image}
                    alt={groupData.name}
                    fill
                    className='object-cover'
                    priority
                  />
                </div>
              )}

              {/* Group Information */}
              <div className='flex-1 space-y-4'>
                <div className='flex flex-wrap items-start gap-3'>
                  <Badge className={getCategoryColor(groupData.category)}>
                    {groupData.category}
                  </Badge>
                  {isMember && <Badge variant='secondary'>Miembro</Badge>}
                  {isPending && (
                    <Badge variant='outline'>Solicitud Pendiente</Badge>
                  )}
                  {!groupData.is_active && (
                    <Badge variant='destructive'>Inactivo</Badge>
                  )}
                </div>

                <div>
                  <h2 className='text-2xl font-bold mb-2'>{groupData.name}</h2>
                  <p className='text-muted-foreground leading-relaxed'>
                    {groupData.description}
                  </p>
                </div>

                {/* Group Stats */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-2xl font-bold text-primary'>
                      {groupData.statistics.totalMembers}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Miembros
                    </div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-2xl font-bold text-primary'>
                      {groupData.statistics.upcomingEvents}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Próximos Eventos
                    </div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-2xl font-bold text-primary'>
                      {groupData.statistics.totalEvents}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Total Eventos
                    </div>
                  </div>
                  <div className='text-center p-3 bg-muted/50 rounded-lg'>
                    <div className='text-2xl font-bold text-primary'>
                      {Math.round(groupData.statistics.eventAttendanceRate)}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Promedio Asistencia
                    </div>
                  </div>
                </div>

                {/* President Information */}
                <div className='flex items-center gap-3 p-4 bg-muted/30 rounded-lg'>
                  <div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
                    <Users className='w-5 h-5 text-primary' />
                  </div>
                  <div>
                    <div className='font-medium'>Presidente</div>
                    <div className='text-sm text-muted-foreground'>
                      {groupData.president_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid lg:grid-cols-2 gap-6'>
          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Miembros ({groupData.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupData.members.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Users className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>No hay miembros registrados</p>
                </div>
              ) : (
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {groupData.members.map(member => (
                    <div
                      key={member.id}
                      className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                          <span className='text-sm font-medium text-primary'>
                            {member.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className='font-medium text-sm'>
                            {member.full_name}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {member.student_id}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {member.role === 'president' && (
                          <Badge variant='default' className='text-xs'>
                            Presidente
                          </Badge>
                        )}
                        <Badge
                          variant={
                            member.status === 'active' ? 'secondary' : 'outline'
                          }
                          className='text-xs'
                        >
                          {member.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Próximos Eventos ({groupData.upcomingEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupData.upcomingEvents.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Calendar className='w-12 h-12 mx-auto mb-3 opacity-50' />
                  <p>No hay eventos próximos</p>
                </div>
              ) : (
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {groupData.upcomingEvents.map((event: Event) => (
                    <div
                      key={event.event_id}
                      className='p-4 border rounded-lg hover:bg-muted/30 transition-colors'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-medium text-sm mb-1 truncate'>
                            {event.title}
                          </h4>
                          <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <Clock className='w-3 h-3' />
                              <span>{formatDate(event.start_datetime)}</span>
                            </div>
                            {event.location && (
                              <div className='flex items-center gap-1'>
                                <MapPin className='w-3 h-3' />
                                <span className='truncate'>
                                  {event.location}
                                </span>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className='text-xs text-muted-foreground mt-2 line-clamp-2'>
                              {event.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={event.is_registered ? 'default' : 'outline'}
                          className='text-xs flex-shrink-0'
                        >
                          {event.is_registered ? 'Registrado' : 'Disponible'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showJoinDialog}
        onClose={() => setShowJoinDialog(false)}
        onConfirm={handleConfirmJoin}
        title='Unirse al Grupo'
        description={`¿Estás seguro de que quieres enviar una solicitud para unirte a "${groupData.name}"? El presidente del grupo revisará tu solicitud.`}
        confirmText='Enviar Solicitud'
        cancelText='Cancelar'
        isLoading={actionLoading === 'join'}
      />

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleConfirmLeave}
        title='Salir del Grupo'
        description={`¿Estás seguro de que quieres salir de "${groupData.name}"? Perderás acceso a los eventos y actividades del grupo.`}
        confirmText='Salir del Grupo'
        cancelText='Cancelar'
        variant='destructive'
        isLoading={actionLoading === 'leave'}
      />
    </div>
  );
}
