'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  eventsApi,
  Event,
  EventAttendee,
  UpdateEventFormData,
} from '@/lib/api/events';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  BarChart3,
  AlertTriangle,
  XCircle,
  Loader2,
  Settings,
  Download,
  Share2,
  Eye,
} from 'lucide-react';
import EventManagementForm from '@/components/events/EventManagementForm';
import AttendeeManagement from '@/components/events/AttendeeManagement';
import EventAnalytics from '@/components/events/EventAnalytics';

export default function EventManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['president', 'admin']}>
      <EventManagementContent />
    </ProtectedRoute>
  );
}

function EventManagementContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setIsLoading(true);
        const [eventData, attendeesData] = await Promise.all([
          eventsApi.getById(eventId),
          eventsApi.getAttendees(eventId),
        ]);
        setEvent(eventData);
        setAttendees(attendeesData);
      } catch (error) {
        console.error('Error loading event data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos del evento',
          variant: 'destructive',
        });
        router.push('/dashboard/president/events');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      loadEventData();
    }
  }, [eventId, router, toast]);

  const handleUpdateEvent = async (data: UpdateEventFormData) => {
    try {
      setIsUpdating(true);
      const updatedEvent = await eventsApi.update(eventId, data);
      setEvent(updatedEvent);
      toast({
        title: 'Éxito',
        description: 'Evento actualizado correctamente',
      });
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el evento',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEvent = async () => {
    try {
      setIsUpdating(true);
      const updatedEvent = await eventsApi.update(eventId, {
        status: 'cancelled',
      });
      setEvent(updatedEvent);
      setShowCancelDialog(false);
      toast({
        title: 'Evento cancelado',
        description:
          'El evento ha sido cancelado y se notificará a los asistentes',
      });
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el evento',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setIsUpdating(true);
      await eventsApi.delete(eventId);
      toast({
        title: 'Evento eliminado',
        description: 'El evento ha sido eliminado permanentemente',
      });
      router.push('/dashboard/president/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAttendeeUpdate = async (attendeeId: string, status: string) => {
    try {
      // Refresh attendees list after update
      const updatedAttendees = await eventsApi.getAttendees(eventId);
      setAttendees(updatedAttendees);
      toast({
        title: 'Estado actualizado',
        description: 'El estado del asistente ha sido actualizado',
      });
    } catch (error) {
      console.error('Error updating attendee:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del asistente',
        variant: 'destructive',
      });
    }
  };

  const formatEventDateTime = (event: Event) => {
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);

    const date = startDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const startTime = startDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const endTime = endDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return { date, time: `${startTime} - ${endTime}` };
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader title='Gestionar Evento' description='Cargando...' />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='h-64 bg-muted rounded-lg'></div>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 h-96 bg-muted rounded-lg'></div>
              <div className='h-96 bg-muted rounded-lg'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Evento no encontrado'
          description='El evento solicitado no existe o no tienes permisos para acceder a él'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <AlertTriangle className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>
                Evento no encontrado
              </h3>
              <p className='text-muted-foreground text-center mb-6'>
                El evento que buscas no existe o no tienes permisos para
                gestionarlo.
              </p>
              <Button
                onClick={() => router.push('/dashboard/president/events')}
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Volver a Eventos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { date, time } = formatEventDateTime(event);

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title={event.title}
        description={`Gestionar evento - ${date}`}
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Header Actions */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/president/events')}
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Volver a Eventos
          </Button>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => router.push(`/dashboard/events/${eventId}`)}
            >
              <Eye className='h-4 w-4 mr-2' />
              Ver Evento
            </Button>
            <Button variant='outline' onClick={() => setActiveTab('edit')}>
              <Edit className='h-4 w-4 mr-2' />
              Editar
            </Button>
            {event.status !== 'cancelled' && (
              <Button
                variant='outline'
                onClick={() => setShowCancelDialog(true)}
                disabled={isUpdating}
              >
                <XCircle className='h-4 w-4 mr-2' />
                Cancelar
              </Button>
            )}
            <Button
              variant='destructive'
              onClick={() => setShowDeleteDialog(true)}
              disabled={isUpdating}
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Event Overview Card */}
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div>
                <CardTitle className='text-2xl'>{event.title}</CardTitle>
                <div className='flex flex-wrap gap-2 mt-2'>
                  <Badge variant='secondary'>{event.event_type}</Badge>
                  <Badge
                    variant={
                      event.status === 'published'
                        ? 'default'
                        : event.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {event.status}
                  </Badge>
                  {event.is_full && <Badge variant='outline'>Completo</Badge>}
                </div>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='sm'>
                  <Share2 className='h-4 w-4 mr-2' />
                  Compartir
                </Button>
                <Button variant='outline' size='sm'>
                  <Download className='h-4 w-4 mr-2' />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='flex items-center gap-3'>
                <Calendar className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>{date}</p>
                  <p className='text-sm text-muted-foreground'>{time}</p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <MapPin className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Ubicación</p>
                  <p className='text-sm text-muted-foreground'>
                    {event.location}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <Users className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Asistentes</p>
                  <p className='text-sm text-muted-foreground'>
                    {event.attendee_count}
                    {event.max_attendees && ` / ${event.max_attendees}`}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3'>
                <Clock className='h-5 w-5 text-muted-foreground' />
                <div>
                  <p className='text-sm font-medium'>Duración</p>
                  <p className='text-sm text-muted-foreground'>
                    {event.duration_hours} horas
                  </p>
                </div>
              </div>
            </div>

            {event.description && (
              <div className='mt-6'>
                <h4 className='text-sm font-medium mb-2'>Descripción</h4>
                <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                  {event.description}
                </p>
              </div>
            )}

            {event.target_groups && event.target_groups.length > 0 && (
              <div className='mt-6'>
                <h4 className='text-sm font-medium mb-2'>Grupos Objetivo</h4>
                <div className='flex flex-wrap gap-2'>
                  {event.target_groups.map(group => (
                    <Badge key={group.group_id} variant='outline'>
                      {group.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Resumen</TabsTrigger>
            <TabsTrigger value='attendees'>Asistentes</TabsTrigger>
            <TabsTrigger value='analytics'>Analíticas</TabsTrigger>
            <TabsTrigger value='edit'>Editar</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5' />
                    Estadísticas Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Total Registrados
                      </span>
                      <span className='font-semibold'>
                        {event.attendee_count}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Capacidad
                      </span>
                      <span className='font-semibold'>
                        {event.max_attendees
                          ? `${event.max_attendees}`
                          : 'Sin límite'}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Estado
                      </span>
                      <Badge
                        variant={
                          event.status === 'published'
                            ? 'default'
                            : event.status === 'cancelled'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Registro Requerido
                      </span>
                      <span className='font-semibold'>
                        {event.requires_registration ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Settings className='h-5 w-5' />
                    Configuración del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {event.registration_deadline && (
                      <div className='flex justify-between items-center'>
                        <span className='text-sm text-muted-foreground'>
                          Límite de Registro
                        </span>
                        <span className='font-semibold'>
                          {new Date(
                            event.registration_deadline
                          ).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Creado
                      </span>
                      <span className='font-semibold'>
                        {new Date(event.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Última Actualización
                      </span>
                      <span className='font-semibold'>
                        {new Date(event.updated_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value='attendees'>
            <AttendeeManagement
              eventId={eventId}
              attendees={attendees}
              onAttendeeUpdate={handleAttendeeUpdate}
            />
          </TabsContent>

          <TabsContent value='analytics'>
            <EventAnalytics event={event} attendees={attendees} />
          </TabsContent>

          <TabsContent value='edit'>
            <EventManagementForm
              event={event}
              onUpdate={handleUpdateEvent}
              isLoading={isUpdating}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel Event Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres cancelar este evento? Se notificará a
              todos los asistentes registrados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowCancelDialog(false)}
              disabled={isUpdating}
            >
              No cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleCancelEvent}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              Sí, cancelar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Event Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este evento permanentemente?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteEvent}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              Sí, eliminar evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
