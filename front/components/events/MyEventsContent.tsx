'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Grid,
  List,
  Calendar,
  Clock,
  CheckCircle,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
} from 'lucide-react';
import { Event, EventFilters } from '@/lib/api/events';
import EventCard from './EventCard';
import MyEventsCalendar from './MyEventsCalendar';
import { useDebounce } from '@/hooks/useDebounce';

interface MyEventsContentProps {
  events: Event[];
  isLoading?: boolean;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Partial<EventFilters>) => void;
  searchQuery?: string;
  currentFilters?: EventFilters;
  onRefresh?: () => void;
}

const EVENT_STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'attended', label: 'Asistidos' },
  { value: 'no_show', label: 'No asistidos' },
  { value: 'cancelled', label: 'Cancelados' },
];

const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Fecha: Próximos primero', icon: Calendar },
  { value: 'date_desc', label: 'Fecha: Lejanos primero', icon: Calendar },
  { value: 'title', label: 'Título A-Z', icon: null },
  { value: 'title_desc', label: 'Título Z-A', icon: null },
  { value: 'status', label: 'Por estado', icon: CheckCircle },
];

const TIME_FILTERS = [
  { value: 'all', label: 'Todos los tiempos' },
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'next_week', label: 'Próxima semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'next_month', label: 'Próximo mes' },
];

export default function MyEventsContent({
  events,
  isLoading = false,
  onUnregister,
  onView,
  onSearch,
  onFilterChange,
  searchQuery,
  onRefresh,
}: MyEventsContentProps) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(searchQuery ?? '');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Helper function to check if date is within time filter
  const isDateInTimeFilter = useCallback(
    (eventDate: string, filter: string): boolean => {
      const now = new Date();
      const eventDateTime = new Date(eventDate);

      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(
        eventDateTime.getFullYear(),
        eventDateTime.getMonth(),
        eventDateTime.getDate()
      );

      switch (filter) {
        case 'today':
          return eventDay.getTime() === today.getTime();
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return eventDay.getTime() === tomorrow.getTime();
        case 'this_week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return eventDay >= startOfWeek && eventDay <= endOfWeek;
        case 'next_week':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
          const nextWeekEnd = new Date(nextWeekStart);
          nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
          return eventDay >= nextWeekStart && eventDay <= nextWeekEnd;
        case 'this_month':
          return (
            eventDateTime.getMonth() === now.getMonth() &&
            eventDateTime.getFullYear() === now.getFullYear()
          );
        case 'next_month':
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          return (
            eventDateTime.getMonth() === nextMonth.getMonth() &&
            eventDateTime.getFullYear() === nextMonth.getFullYear()
          );
        default:
          return true;
      }
    },
    []
  );

  // Memoized filtered and sorted events
  const filteredAndSortedEvents = useMemo(() => {
    if (!events || !Array.isArray(events) || events.length === 0) return [];

    let filtered = [...events];

    // Filter by search term
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower) ||
          event.target_groups.some(group =>
            group.name.toLowerCase().includes(searchLower)
          )
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      const now = new Date();
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_datetime);
        const isPast = eventDate < now;
        const isUpcoming = eventDate > now;

        switch (selectedStatus) {
          case 'upcoming':
            return isUpcoming;
          case 'past':
            return isPast;
          case 'attended':
            return event.user_attendance_status === 'attended';
          case 'no_show':
            return event.user_attendance_status === 'no_show';
          case 'cancelled':
            return event.user_attendance_status === 'cancelled';
          default:
            return true;
        }
      });
    }

    // Filter by time range
    if (timeFilter !== 'all') {
      filtered = filtered.filter(event =>
        isDateInTimeFilter(event.start_datetime, timeFilter)
      );
    }

    // Sort events
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return (
            new Date(a.start_datetime).getTime() -
            new Date(b.start_datetime).getTime()
          );
        case 'date_desc':
          return (
            new Date(b.start_datetime).getTime() -
            new Date(a.start_datetime).getTime()
          );
        case 'title':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'status':
          // Sort by attendance status
          const statusOrder = {
            registered: 0,
            confirmed: 1,
            attended: 2,
            no_show: 3,
            cancelled: 4,
          };
          const aStatus = a.user_attendance_status || 'registered';
          const bStatus = b.user_attendance_status || 'registered';
          return statusOrder[aStatus] - statusOrder[bStatus];
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    events,
    debouncedSearchTerm,
    selectedStatus,
    timeFilter,
    sortBy,
    isDateInTimeFilter,
  ]);

  // Separate events by status for different tabs
  const upcomingEvents = useMemo(
    () =>
      filteredAndSortedEvents.filter(event => {
        const now = new Date();
        return new Date(event.start_datetime) > now;
      }),
    [filteredAndSortedEvents]
  );

  const pastEvents = useMemo(
    () =>
      filteredAndSortedEvents.filter(event => {
        const now = new Date();
        return new Date(event.start_datetime) <= now;
      }),
    [filteredAndSortedEvents]
  );

  const attendedEvents = useMemo(
    () =>
      filteredAndSortedEvents.filter(
        event => event.user_attendance_status === 'attended'
      ),
    [filteredAndSortedEvents]
  );

  const handleSearch = useCallback(
    (value: string) => {
      if (onSearch) {
        onSearch(value);
      } else {
        setSearchTerm(value);
      }
    },
    [onSearch]
  );

  const clearAllFilters = useCallback(() => {
    if (onFilterChange) {
      onFilterChange({});
    }
    if (onSearch) {
      onSearch('');
    }
    setSearchTerm('');
    setSelectedStatus('all');
    setTimeFilter('all');
    setSortBy('date_asc');
  }, [onFilterChange, onSearch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm.trim()) count++;
    if (selectedStatus !== 'all') count++;
    if (timeFilter !== 'all') count++;
    return count;
  }, [debouncedSearchTerm, selectedStatus, timeFilter]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='bg-muted rounded-lg h-64'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with stats and actions */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <h2 className='text-2xl font-bold'>Mis Eventos</h2>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-sm'>
              {upcomingEvents.length} próximos
            </Badge>
            <Badge variant='outline' className='text-sm'>
              {attendedEvents.length} asistidos
            </Badge>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {onRefresh && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={isLoading}
              aria-label='Actualizar eventos'
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          )}

          <div className='flex items-center gap-1 border rounded-md p-1'>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('grid')}
              aria-label='Vista de cuadrícula'
              className='h-8 w-8 p-0'
            >
              <Grid className='w-4 h-4' />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size='sm'
              onClick={() => setViewMode('list')}
              aria-label='Vista de lista'
              className='h-8 w-8 p-0'
            >
              <List className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className='space-y-4'>
        {/* Search bar */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
          <Input
            placeholder='Buscar en mis eventos...'
            value={searchQuery ?? searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className='pl-10'
            aria-label='Buscar eventos'
          />
        </div>

        {/* Filters row */}
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
          <div className='flex items-center gap-2 sm:hidden'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className='flex items-center gap-2'
            >
              <Filter className='w-4 h-4' />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`}
              />
            </Button>
          </div>

          <div
            className={`flex flex-wrap gap-2 ${showFiltersPanel ? 'block' : 'hidden sm:flex'}`}
          >
            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                {EVENT_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time filter */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='Cuándo' />
              </SelectTrigger>
              <SelectContent>
                {TIME_FILTERS.map(filter => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Ordenar por' />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className='flex items-center gap-2'>
                      {option.icon && <option.icon className='w-4 h-4' />}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearAllFilters}
                className='flex items-center gap-1'
              >
                <X className='w-4 h-4' />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content with tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='list' className='flex items-center gap-2'>
            <List className='w-4 h-4' />
            Lista
          </TabsTrigger>
          <TabsTrigger value='calendar' className='flex items-center gap-2'>
            <Calendar className='w-4 h-4' />
            Calendario
          </TabsTrigger>
          <TabsTrigger value='upcoming' className='flex items-center gap-2'>
            <Clock className='w-4 h-4' />
            Próximos ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value='history' className='flex items-center gap-2'>
            <CheckCircle className='w-4 h-4' />
            Historial ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='list' className='space-y-4'>
          <EventListView
            events={filteredAndSortedEvents}
            viewMode={viewMode}
            onUnregister={onUnregister}
            onView={onView}
            emptyMessage='No tienes eventos registrados'
          />
        </TabsContent>

        <TabsContent value='calendar' className='space-y-4'>
          <MyEventsCalendar events={filteredAndSortedEvents} onView={onView} />
        </TabsContent>

        <TabsContent value='upcoming' className='space-y-4'>
          <EventListView
            events={upcomingEvents}
            viewMode={viewMode}
            onUnregister={onUnregister}
            onView={onView}
            emptyMessage='No tienes eventos próximos'
          />
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <EventListView
            events={pastEvents}
            viewMode={viewMode}
            onUnregister={onUnregister}
            onView={onView}
            emptyMessage='No tienes eventos pasados'
            showAttendanceStatus={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EventListViewProps {
  events: Event[];
  viewMode: 'grid' | 'list';
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  emptyMessage: string;
  showAttendanceStatus?: boolean;
}

function EventListView({
  events,
  viewMode,
  onUnregister,
  onView,
  emptyMessage,
  showAttendanceStatus = false,
}: EventListViewProps) {
  if (events.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
          <Calendar className='w-8 h-8 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>
          No se encontraron eventos
        </h3>
        <p className='text-muted-foreground'>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
      }
    >
      {events.map(event => (
        <EventCard
          key={event.event_id}
          event={event}
          variant={viewMode === 'list' ? 'compact' : 'default'}
          onUnregister={onUnregister}
          onView={onView}
          showAttendanceStatus={showAttendanceStatus}
        />
      ))}
    </div>
  );
}
