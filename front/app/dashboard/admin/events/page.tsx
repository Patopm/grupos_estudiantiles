'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { eventsApi, Event } from '@/lib/api/events';

export default function AdminEventsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminEventsContent />
    </ProtectedRoute>
  );
}

function AdminEventsContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventsApi.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventsApi.delete(eventId);
      toast({
        title: 'Éxito',
        description: 'Evento eliminado correctamente',
      });
      loadEvents();
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el evento',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEventStatus = async (
    eventId: string,
    currentStatus: string
  ) => {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await eventsApi.update(eventId, { status: newStatus });
      toast({
        title: 'Éxito',
        description: `Evento ${newStatus === 'published' ? 'publicado' : 'ocultado'} correctamente`,
      });
      loadEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del evento',
        variant: 'destructive',
      });
    }
  };

  const filteredEvents = (events || []).filter(event => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.event_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const eventTypes = Array.from(new Set((events || []).map(e => e.event_type)));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Gestión de Eventos'
          description='Administrar eventos del sistema'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='animate-pulse space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='h-48 bg-muted rounded-lg'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Gestión de Eventos'
        description='Administrar eventos del sistema'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Header Actions */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div className='flex flex-col sm:flex-row gap-4 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar eventos...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                <SelectItem value='published'>Publicados</SelectItem>
                <SelectItem value='draft'>Borradores</SelectItem>
                <SelectItem value='cancelled'>Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Tipo' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los tipos</SelectItem>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => router.push('/dashboard/admin/events/new')}>
            <Plus className='w-4 h-4 mr-2' />
            Nuevo Evento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Eventos
                  </p>
                  <p className='text-2xl font-bold'>{(events || []).length}</p>
                </div>
                <Calendar className='w-8 h-8 text-primary' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Publicados
                  </p>
                  <p className='text-2xl font-bold'>
                    {
                      (events || []).filter(e => e.status === 'published')
                        .length
                    }
                  </p>
                </div>
                <CheckCircle className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Borradores
                  </p>
                  <p className='text-2xl font-bold'>
                    {(events || []).filter(e => e.status === 'draft').length}
                  </p>
                </div>
                <AlertCircle className='w-8 h-8 text-yellow-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Asistentes
                  </p>
                  <p className='text-2xl font-bold'>
                    {(events || []).reduce(
                      (sum, e) => sum + e.attendee_count,
                      0
                    )}
                  </p>
                </div>
                <Users className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredEvents.map(event => (
            <Card
              key={event.event_id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>{event.title}</CardTitle>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {event.event_type}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(event.status)}>
                    {event.status === 'published'
                      ? 'Publicado'
                      : event.status === 'draft'
                        ? 'Borrador'
                        : event.status === 'cancelled'
                          ? 'Cancelado'
                          : event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <p className='text-sm text-muted-foreground line-clamp-2'>
                    {event.description}
                  </p>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Clock className='w-4 h-4 text-muted-foreground' />
                      <span>
                        {new Date(event.start_datetime).toLocaleString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <MapPin className='w-4 h-4 text-muted-foreground' />
                      <span className='truncate'>{event.location}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <Users className='w-4 h-4 text-muted-foreground' />
                      <span>{event.attendee_count} asistentes</span>
                      {event.max_attendees && (
                        <span className='text-muted-foreground'>
                          / {event.max_attendees}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        router.push(`/dashboard/admin/events/${event.event_id}`)
                      }
                      className='flex-1'
                    >
                      <Eye className='w-4 h-4 mr-1' />
                      Ver
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        router.push(
                          `/dashboard/admin/events/${event.event_id}/edit`
                        )
                      }
                      className='flex-1'
                    >
                      <Edit className='w-4 h-4 mr-1' />
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant={
                        event.status === 'published' ? 'secondary' : 'default'
                      }
                      onClick={() =>
                        handleToggleEventStatus(event.event_id, event.status)
                      }
                    >
                      {event.status === 'published' ? (
                        <XCircle className='w-4 h-4' />
                      ) : (
                        <CheckCircle className='w-4 h-4' />
                      )}
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className='text-center py-12'>
            <Calendar className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              No se encontraron eventos
            </h3>
            <p className='text-muted-foreground mb-4'>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay eventos registrados en el sistema'}
            </p>
            <Button onClick={() => router.push('/dashboard/admin/events/new')}>
              <Plus className='w-4 h-4 mr-2' />
              Crear Primer Evento
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar evento?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el evento <strong>{selectedEvent?.title}</strong> y todos sus
                datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant='destructive'
                onClick={() =>
                  selectedEvent && handleDeleteEvent(selectedEvent.event_id)
                }
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
