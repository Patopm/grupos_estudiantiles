'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { eventsApi, Event, EventFilters } from '@/lib/api/events';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Settings,
  Eye,
  Trash2,
  Loader2,
} from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import { useDebounce } from '@/hooks/useDebounce';

export default function PresidentEventsPage() {
  return (
    <ProtectedRoute allowedRoles={['president', 'admin']}>
      <PresidentEventsContent />
    </ProtectedRoute>
  );
}

function PresidentEventsContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const filters: EventFilters = {
          search: debouncedSearchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
        };

        // For presidents, we want to show all events they can manage
        // This would typically be events from their groups
        const eventsData = await eventsApi.getAll(filters);
        setEvents(eventsData);
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

    loadEvents();
  }, [debouncedSearchTerm, statusFilter, typeFilter, toast]);

  const handleCreateEvent = () => {
    router.push('/dashboard/president/events/create');
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`);
  };

  const handleManageEvent = (eventId: string) => {
    router.push(`/dashboard/president/events/${eventId}`);
  };

  const filteredEvents = events.filter(event => {
    // Additional client-side filtering if needed
    return true;
  });

  const eventStats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
  };

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Mis Eventos'
        description='Gestiona los eventos que has creado'
        breadcrumbs={[{ label: 'Eventos', current: true }]}
        showBackButton={true}
        actions={
          <Button onClick={handleCreateEvent}>
            <Plus className='h-4 w-4 mr-2' />
            Crear Evento
          </Button>
        }
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Eventos
                  </p>
                  <p className='text-2xl font-bold'>{eventStats.total}</p>
                </div>
                <Calendar className='h-8 w-8 text-muted-foreground' />
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
                  <p className='text-2xl font-bold text-green-600'>
                    {eventStats.published}
                  </p>
                </div>
                <Users className='h-8 w-8 text-green-600' />
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
                  <p className='text-2xl font-bold text-yellow-600'>
                    {eventStats.draft}
                  </p>
                </div>
                <Settings className='h-8 w-8 text-yellow-600' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Cancelados
                  </p>
                  <p className='text-2xl font-bold text-red-600'>
                    {eventStats.cancelled}
                  </p>
                </div>
                <Trash2 className='h-8 w-8 text-red-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Buscar eventos...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filtrar por estado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los estados</SelectItem>
                  <SelectItem value='draft'>Borrador</SelectItem>
                  <SelectItem value='published'>Publicado</SelectItem>
                  <SelectItem value='cancelled'>Cancelado</SelectItem>
                  <SelectItem value='completed'>Completado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='w-full sm:w-48'>
                  <SelectValue placeholder='Filtrar por tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos los tipos</SelectItem>
                  <SelectItem value='academic'>Académico</SelectItem>
                  <SelectItem value='social'>Social</SelectItem>
                  <SelectItem value='sports'>Deportivo</SelectItem>
                  <SelectItem value='cultural'>Cultural</SelectItem>
                  <SelectItem value='meeting'>Reunión</SelectItem>
                  <SelectItem value='workshop'>Taller</SelectItem>
                  <SelectItem value='conference'>Conferencia</SelectItem>
                  <SelectItem value='other'>Otro</SelectItem>
                </SelectContent>
              </Select>

              <div className='flex gap-2'>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setViewMode('grid')}
                >
                  <Filter className='h-4 w-4' />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                >
                  <Settings className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <span className='ml-2'>Cargando eventos...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-12'>
              <Calendar className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>No hay eventos</h3>
              <p className='text-muted-foreground text-center mb-6'>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No se encontraron eventos con los filtros aplicados'
                  : 'Aún no has creado ningún evento. ¡Crea tu primer evento!'}
              </p>
              <Button onClick={handleCreateEvent}>
                <Plus className='h-4 w-4 mr-2' />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredEvents.map(event => (
              <div key={event.event_id}>
                {viewMode === 'grid' ? (
                  <EventCard
                    event={event}
                    variant='default'
                    showActions={true}
                    onView={() => handleViewEvent(event.event_id)}
                    onManage={() => handleManageEvent(event.event_id)}
                  />
                ) : (
                  <Card>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-3 mb-2'>
                            <h3 className='text-lg font-semibold'>
                              {event.title}
                            </h3>
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
                            <Badge variant='outline'>{event.event_type}</Badge>
                          </div>
                          <p className='text-sm text-muted-foreground mb-2'>
                            {event.description.length > 100
                              ? `${event.description.substring(0, 100)}...`
                              : event.description}
                          </p>
                          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                            <span>
                              {new Date(
                                event.start_datetime
                              ).toLocaleDateString('es-ES')}
                            </span>
                            <span>{event.location}</span>
                            <span>{event.attendee_count} asistentes</span>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewEvent(event.event_id)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleManageEvent(event.event_id)}
                          >
                            <Settings className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
