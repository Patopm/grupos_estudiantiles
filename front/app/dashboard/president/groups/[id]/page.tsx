'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, GroupDetailData, GroupRequest } from '@/lib/api/groups';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Settings,
  BarChart3,
  UserPlus,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  AlertTriangle,
} from 'lucide-react';

export default function GroupManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['president', 'admin']}>
      <GroupManagementContent />
    </ProtectedRoute>
  );
}

function GroupManagementContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const groupId = params.id as string;

  const [groupData, setGroupData] = useState<GroupDetailData | null>(null);
  const [pendingRequests, setPendingRequests] = useState<GroupRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingRequest, setProcessingRequest] = useState<number | null>(
    null
  );

  // Load group data
  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;

      try {
        setIsLoading(true);

        // Load group details and pending requests in parallel
        const [groupDetails, requests] = await Promise.all([
          groupsApi.getDetailedById(groupId),
          groupsApi.getRequests(groupId),
        ]);

        // Verify user has permission to manage this group
        if (user?.role !== 'admin' && groupDetails.president_id !== user?.id) {
          toast({
            title: 'Acceso Denegado',
            description: 'No tienes permisos para gestionar este grupo',
            variant: 'destructive',
          });
          router.push('/dashboard/president');
          return;
        }

        setGroupData(groupDetails);
        setPendingRequests(requests);
      } catch (error) {
        console.error('Error loading group data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del grupo',
          variant: 'destructive',
        });
        router.push('/dashboard/president');
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupData();
  }, [groupId, user, router, toast]);

  // Handle membership request approval
  const handleApproveRequest = async (userId: number) => {
    if (!groupId) return;

    try {
      setProcessingRequest(userId);
      await groupsApi.approveRequest(groupId, userId);

      // Remove from pending requests and refresh group data
      setPendingRequests(prev => prev.filter(req => req.user_id !== userId));

      // Refresh group data to update member count
      const updatedGroup = await groupsApi.getDetailedById(groupId);
      setGroupData(updatedGroup);

      toast({
        title: 'Solicitud Aprobada',
        description: 'El usuario ha sido agregado al grupo exitosamente',
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la solicitud. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle membership request rejection
  const handleRejectRequest = async (userId: number) => {
    if (!groupId) return;

    try {
      setProcessingRequest(userId);
      await groupsApi.rejectRequest(groupId, userId);

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.user_id !== userId));

      toast({
        title: 'Solicitud Rechazada',
        description: 'La solicitud ha sido rechazada',
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader title='Gestión de Grupo' description='Cargando...' />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-32 bg-muted rounded-lg'></div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='h-24 bg-muted rounded-lg'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Grupo No Encontrado'
          description='El grupo solicitado no existe o no tienes permisos para acceder'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <Card>
            <CardContent className='p-6 text-center'>
              <AlertTriangle className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                Grupo No Encontrado
              </h3>
              <p className='text-muted-foreground mb-4'>
                El grupo que buscas no existe o no tienes permisos para
                gestionarlo.
              </p>
              <Button onClick={() => router.push('/dashboard/president')}>
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={`Gestión: ${groupData.name}`}
        description={`Administra tu grupo estudiantil - ${groupData.category}`}
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Group Overview Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                  <Users className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Miembros</p>
                  <p className='text-2xl font-bold'>
                    {groupData.member_count}/{groupData.max_members}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center'>
                  <UserPlus className='w-5 h-5 text-orange-600 dark:text-orange-400' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Solicitudes</p>
                  <p className='text-2xl font-bold'>{pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center'>
                  <Calendar className='w-5 h-5 text-green-600 dark:text-green-400' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Eventos</p>
                  <p className='text-2xl font-bold'>
                    {groupData.statistics.upcomingEvents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Activos</p>
                  <p className='text-2xl font-bold'>
                    {groupData.statistics.activeMembers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Resumen</TabsTrigger>
            <TabsTrigger value='requests'>
              Solicitudes
              {pendingRequests.length > 0 && (
                <Badge variant='destructive' className='ml-2 text-xs'>
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='members'>Miembros</TabsTrigger>
            <TabsTrigger value='settings'>Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* Group Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Settings className='w-5 h-5' />
                    Información del Grupo
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Nombre
                    </label>
                    <p className='text-lg font-semibold'>{groupData.name}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-muted-foreground'>
                      Descripción
                    </label>
                    <p className='text-sm'>{groupData.description}</p>
                  </div>
                  <div className='flex gap-4'>
                    <div>
                      <label className='text-sm font-medium text-muted-foreground'>
                        Categoría
                      </label>
                      <Badge className='block w-fit mt-1'>
                        {groupData.category}
                      </Badge>
                    </div>
                    <div>
                      <label className='text-sm font-medium text-muted-foreground'>
                        Estado
                      </label>
                      <Badge
                        variant={groupData.is_active ? 'default' : 'secondary'}
                        className='block w-fit mt-1'
                      >
                        {groupData.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='w-5 h-5' />
                    Estadísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center p-3 bg-muted/50 rounded-lg'>
                      <p className='text-2xl font-bold text-blue-600'>
                        {groupData.statistics.totalMembers}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Total Miembros
                      </p>
                    </div>
                    <div className='text-center p-3 bg-muted/50 rounded-lg'>
                      <p className='text-2xl font-bold text-green-600'>
                        {groupData.statistics.activeMembers}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Miembros Activos
                      </p>
                    </div>
                    <div className='text-center p-3 bg-muted/50 rounded-lg'>
                      <p className='text-2xl font-bold text-purple-600'>
                        {groupData.statistics.totalEvents}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Total Eventos
                      </p>
                    </div>
                    <div className='text-center p-3 bg-muted/50 rounded-lg'>
                      <p className='text-2xl font-bold text-orange-600'>
                        {groupData.statistics.upcomingEvents}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Próximos Eventos
                      </p>
                    </div>
                  </div>

                  {/* Capacity Progress */}
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Capacidad del Grupo</span>
                      <span>
                        {Math.round(
                          (groupData.member_count / groupData.max_members) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                      <div
                        className='bg-primary h-2 rounded-full transition-all duration-300'
                        style={{
                          width: `${(groupData.member_count / groupData.max_members) * 100}%`,
                        }}
                      />
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {groupData.member_count} de {groupData.max_members}{' '}
                      miembros
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {groupData.upcomingEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='w-5 h-5' />
                    Próximos Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {groupData.upcomingEvents.slice(0, 3).map(event => (
                      <div
                        key={event.event_id}
                        className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'
                      >
                        <div className='w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center'>
                          <Calendar className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-medium'>{event.title}</h4>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(event.start_datetime).toLocaleDateString(
                              'es-ES',
                              {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                        <Badge variant='outline'>
                          {event.attendee_count} asistentes
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value='requests' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <UserPlus className='w-5 h-5' />
                  Solicitudes Pendientes ({pendingRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className='text-center py-8'>
                    <UserCheck className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='text-lg font-semibold mb-2'>
                      No hay solicitudes pendientes
                    </h3>
                    <p className='text-muted-foreground'>
                      Todas las solicitudes de membresía han sido procesadas.
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {pendingRequests.map(request => (
                      <div
                        key={request.id}
                        className='flex items-center justify-between p-4 border rounded-lg'
                      >
                        <div className='flex items-center gap-4'>
                          <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                            <UserPlus className='w-6 h-6 text-primary' />
                          </div>
                          <div>
                            <h4 className='font-medium'>{request.full_name}</h4>
                            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                              <div className='flex items-center gap-1'>
                                <Mail className='w-4 h-4' />
                                {request.email}
                              </div>
                              <div className='flex items-center gap-1'>
                                <Clock className='w-4 h-4' />
                                {new Date(
                                  request.requested_at
                                ).toLocaleDateString('es-ES')}
                              </div>
                            </div>
                            <p className='text-sm text-muted-foreground mt-1'>
                              Matrícula: {request.student_id}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Button
                            size='sm'
                            onClick={() =>
                              handleApproveRequest(request.user_id)
                            }
                            disabled={processingRequest === request.user_id}
                            className='bg-green-600 hover:bg-green-700'
                          >
                            {processingRequest === request.user_id ? (
                              <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full' />
                            ) : (
                              <CheckCircle className='w-4 h-4' />
                            )}
                            Aprobar
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => handleRejectRequest(request.user_id)}
                            disabled={processingRequest === request.user_id}
                          >
                            {processingRequest === request.user_id ? (
                              <div className='animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full' />
                            ) : (
                              <XCircle className='w-4 h-4' />
                            )}
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value='members' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  Miembros del Grupo ({groupData.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {groupData.members.map(member => (
                    <div
                      key={member.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
                          <Users className='w-6 h-6 text-primary' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <h4 className='font-medium'>{member.full_name}</h4>
                            {member.role === 'president' && (
                              <Badge variant='default' className='text-xs'>
                                Presidente
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <Mail className='w-4 h-4' />
                              {member.email}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Clock className='w-4 h-4' />
                              Desde{' '}
                              {new Date(member.joined_at).toLocaleDateString(
                                'es-ES'
                              )}
                            </div>
                          </div>
                          <p className='text-sm text-muted-foreground mt-1'>
                            Matrícula: {member.student_id}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant={
                            member.status === 'active' ? 'default' : 'secondary'
                          }
                          className='text-xs'
                        >
                          {member.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='w-5 h-5' />
                  Configuración del Grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-6'>
                  <div className='p-4 bg-muted/50 rounded-lg'>
                    <h4 className='font-medium mb-2'>Información Básica</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      <div>
                        <label className='font-medium text-muted-foreground'>
                          Nombre del Grupo
                        </label>
                        <p>{groupData.name}</p>
                      </div>
                      <div>
                        <label className='font-medium text-muted-foreground'>
                          Categoría
                        </label>
                        <p>{groupData.category}</p>
                      </div>
                      <div>
                        <label className='font-medium text-muted-foreground'>
                          Capacidad Máxima
                        </label>
                        <p>{groupData.max_members} miembros</p>
                      </div>
                      <div>
                        <label className='font-medium text-muted-foreground'>
                          Estado
                        </label>
                        <p>{groupData.is_active ? 'Activo' : 'Inactivo'}</p>
                      </div>
                    </div>
                  </div>

                  <div className='p-4 bg-muted/50 rounded-lg'>
                    <h4 className='font-medium mb-2'>Descripción</h4>
                    <p className='text-sm'>{groupData.description}</p>
                  </div>

                  <div className='p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
                    <div className='flex items-start gap-3'>
                      <AlertTriangle className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5' />
                      <div>
                        <h4 className='font-medium text-yellow-800 dark:text-yellow-200'>
                          Edición de Configuración
                        </h4>
                        <p className='text-sm text-yellow-700 dark:text-yellow-300 mt-1'>
                          La funcionalidad de edición de configuración del grupo
                          estará disponible en una futura actualización. Por
                          ahora, contacta al administrador para realizar
                          cambios.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
