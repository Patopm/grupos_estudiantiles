'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Grid,
  List,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  CalendarDays,
  RefreshCw,
  Download,
  Share2,
} from 'lucide-react';
import { Event, EVENT_TYPE_LABELS, EventFilters } from '@/lib/api/events';
import EventCard from './EventCard';
import { useDebounce } from '@/hooks/useDebounce';

interface EventListProps {
  events: Event[];
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  variant?: 'default' | 'compact';
  emptyMessage?: string;
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
  onView?: (eventId: string) => void;
  onManage?: (eventId: string) => void;
  isLoading?: boolean;
  enablePagination?: boolean;
  itemsPerPage?: number;
  showExport?: boolean;
  showRefresh?: boolean;
  showShare?: boolean;
  onRefresh?: () => void;
  onExport?: (events: Event[]) => void;
  onShare?: (events: Event[]) => void;
  enableQuickFilters?: boolean;
  defaultFilters?: Partial<EventFilters>;
  // External control props
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Partial<EventFilters>) => void;
  searchQuery?: string;
  currentFilters?: EventFilters;
}

const EVENT_TYPES = [
  { value: 'all', label: 'Todos' },
  { value: 'academic', label: 'Académico' },
  { value: 'social', label: 'Social' },
  { value: 'sports', label: 'Deportivo' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'workshop', label: 'Taller' },
  { value: 'conference', label: 'Conferencia' },
  { value: 'other', label: 'Otro' },
];

const EVENT_STATUSES = [
  { value: 'all', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'completed', label: 'Completados' },
];

const SORT_OPTIONS = [
  { value: 'date_asc', label: 'Fecha: Próximos primero', icon: Calendar },
  { value: 'date_desc', label: 'Fecha: Lejanos primero', icon: Calendar },
  { value: 'title', label: 'Título A-Z', icon: null },
  { value: 'title_desc', label: 'Título Z-A', icon: null },
  { value: 'attendees', label: 'Más Registrados', icon: Users },
  { value: 'attendees_desc', label: 'Menos Registrados', icon: Users },
  { value: 'recent', label: 'Creados Recientemente', icon: Clock },
  { value: 'popularity', label: 'Más Populares', icon: TrendingUp },
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

const QUICK_FILTERS = [
  {
    id: 'upcoming',
    label: 'Próximos',
    icon: Calendar,
    description: 'Eventos que están por ocurrir',
    filter: { upcomingOnly: true, selectedStatus: 'published' },
  },
  {
    id: 'my_events',
    label: 'Mis Eventos',
    icon: Users,
    description: 'Eventos en los que estoy registrado',
    filter: { myEventsOnly: true },
  },
  {
    id: 'this_week',
    label: 'Esta Semana',
    icon: CalendarDays,
    description: 'Eventos de esta semana',
    filter: { timeFilter: 'this_week', selectedStatus: 'published' },
  },
  {
    id: 'academic',
    label: 'Académicos',
    icon: TrendingUp,
    description: 'Eventos académicos y educativos',
    filter: { selectedTypes: ['academic'], selectedStatus: 'published' },
  },
  {
    id: 'social',
    label: 'Sociales',
    icon: Users,
    description: 'Eventos sociales y de entretenimiento',
    filter: { selectedTypes: ['social'], selectedStatus: 'published' },
  },
  {
    id: 'available',
    label: 'Disponibles',
    icon: Clock,
    description: 'Eventos con cupo disponible',
    filter: { availableOnly: true, selectedStatus: 'published' },
  },
];

export default function EventList({
  events,
  title,
  showSearch = true,
  showFilters = true,
  showViewToggle = false,
  variant = 'default',
  emptyMessage = 'No hay eventos disponibles',
  onRegister,
  onUnregister,
  onView,
  onManage,
  isLoading = false,
  enablePagination = true,
  itemsPerPage = 12,
  showExport = false,
  showRefresh = false,
  showShare = false,
  onRefresh,
  onExport,
  onShare,
  enableQuickFilters = true,
  defaultFilters = {},
  // External control props
  onSearch,
  onFilterChange,
  searchQuery,
  currentFilters,
}: EventListProps) {
  // Search and filter state - use external control if provided
  const [searchTerm, setSearchTerm] = useState(
    searchQuery ?? (defaultFilters.search || '')
  );
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    currentFilters?.type
      ? [currentFilters.type]
      : defaultFilters.type
        ? [defaultFilters.type]
        : ['all']
  );
  const [selectedStatus, setSelectedStatus] = useState(
    currentFilters?.status ?? (defaultFilters.status || 'all')
  );
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );

  // Date range filters
  const [startDate, setStartDate] = useState(
    currentFilters?.start_date ?? (defaultFilters.start_date || '')
  );
  const [endDate, setEndDate] = useState(
    currentFilters?.end_date ?? (defaultFilters.end_date || '')
  );
  const [showDateRange, setShowDateRange] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Additional filters
  const [requiresRegistrationOnly, setRequiresRegistrationOnly] =
    useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Helper function to check if date is within time filter
  const isDateInTimeFilter = useCallback(
    (eventDate: string, filter: string): boolean => {
      const now = new Date();
      const eventDateTime = new Date(eventDate);

      // Reset time to start of day for accurate comparisons
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

    // Filter by search term (debounced)
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

    // Filter by event types (multi-select)
    if (!selectedTypes.includes('all') && selectedTypes.length > 0) {
      filtered = filtered.filter(event =>
        selectedTypes.includes(event.event_type)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }

    // Filter by time range
    if (timeFilter !== 'all') {
      filtered = filtered.filter(event =>
        isDateInTimeFilter(event.start_datetime, timeFilter)
      );
    }

    // Filter by custom date range
    if (startDate) {
      const startDateTime = new Date(startDate);
      filtered = filtered.filter(
        event => new Date(event.start_datetime) >= startDateTime
      );
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(
        event => new Date(event.start_datetime) <= endDateTime
      );
    }

    // Filter by registration requirement
    if (requiresRegistrationOnly) {
      filtered = filtered.filter(event => event.requires_registration);
    }

    // Filter by availability (not full)
    if (availableOnly) {
      filtered = filtered.filter(event => !event.is_full);
    }

    // Filter by user's events
    if (myEventsOnly) {
      filtered = filtered.filter(event => event.is_registered);
    }

    // Filter by upcoming events only
    if (upcomingOnly) {
      const now = new Date();
      filtered = filtered.filter(event => new Date(event.start_datetime) > now);
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
        case 'attendees':
          return b.attendee_count - a.attendee_count;
        case 'attendees_desc':
          return a.attendee_count - b.attendee_count;
        case 'recent':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'popularity':
          // Sort by attendee count as a proxy for popularity
          return b.attendee_count - a.attendee_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    events,
    debouncedSearchTerm,
    selectedTypes,
    selectedStatus,
    timeFilter,
    startDate,
    endDate,
    sortBy,
    requiresRegistrationOnly,
    availableOnly,
    myEventsOnly,
    upcomingOnly,
    isDateInTimeFilter,
  ]);

  // Paginated events
  const paginatedEvents = useMemo(() => {
    if (!enablePagination) return filteredAndSortedEvents;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEvents.slice(startIndex, endIndex);
  }, [filteredAndSortedEvents, currentPage, itemsPerPage, enablePagination]);

  // Pagination info
  const totalPages = Math.ceil(filteredAndSortedEvents.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    selectedTypes,
    selectedStatus,
    timeFilter,
    startDate,
    endDate,
    sortBy,
    requiresRegistrationOnly,
    availableOnly,
    myEventsOnly,
    upcomingOnly,
  ]);

  // Event type selection handlers
  const handleTypeToggle = useCallback(
    (typeValue: string) => {
      const newTypes = (() => {
        if (typeValue === 'all') {
          return ['all'];
        }

        const currentTypes = selectedTypes;
        const newTypes = currentTypes.includes('all')
          ? [typeValue]
          : currentTypes.includes(typeValue)
            ? currentTypes.filter(t => t !== typeValue)
            : [...currentTypes.filter(t => t !== 'all'), typeValue];

        return newTypes.length === 0 ? ['all'] : newTypes;
      })();

      if (onFilterChange) {
        onFilterChange({
          type: newTypes.includes('all') ? undefined : newTypes[0],
        });
      } else {
        setSelectedTypes(newTypes);
      }
    },
    [selectedTypes, onFilterChange]
  );

  const clearAllFilters = useCallback(() => {
    if (onFilterChange) {
      onFilterChange({});
    }
    if (onSearch) {
      onSearch('');
    }
    setSearchTerm('');
    setSelectedTypes(['all']);
    setSelectedStatus('all');
    setTimeFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('date_asc');
    setRequiresRegistrationOnly(false);
    setAvailableOnly(false);
    setMyEventsOnly(false);
    setUpcomingOnly(true);
    setCurrentPage(1);
    setActiveQuickFilter(null);
    setShowDateRange(false);
  }, [onFilterChange, onSearch]);

  // Quick filter handler
  const handleQuickFilter = useCallback(
    (filterId: string) => {
      const quickFilter = QUICK_FILTERS.find(f => f.id === filterId);
      if (!quickFilter) return;

      // If clicking the same filter, deactivate it
      if (activeQuickFilter === filterId) {
        setActiveQuickFilter(null);
        clearAllFilters();
        return;
      }

      // Apply the quick filter
      setActiveQuickFilter(filterId);

      // Reset all filters first
      setSearchTerm('');
      setSelectedTypes(['all']);
      setSelectedStatus('all');
      setTimeFilter('all');
      setStartDate('');
      setEndDate('');
      setRequiresRegistrationOnly(false);
      setAvailableOnly(false);
      setMyEventsOnly(false);
      setUpcomingOnly(true);
      setCurrentPage(1);

      // Apply quick filter settings
      const { filter } = quickFilter;

      if (filter.upcomingOnly) setUpcomingOnly(true);
      if (filter.myEventsOnly) setMyEventsOnly(true);
      if (filter.timeFilter) setTimeFilter(filter.timeFilter);
      if (filter.selectedTypes) setSelectedTypes(filter.selectedTypes);
      if (filter.selectedStatus) setSelectedStatus(filter.selectedStatus);
      if (filter.availableOnly) setAvailableOnly(true);
    },
    [activeQuickFilter, clearAllFilters]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm.trim()) count++;
    if (!selectedTypes.includes('all')) count++;
    if (selectedStatus !== 'all') count++;
    if (timeFilter !== 'all') count++;
    if (startDate || endDate) count++;
    if (requiresRegistrationOnly) count++;
    if (availableOnly) count++;
    if (myEventsOnly) count++;
    if (!upcomingOnly) count++;
    return count;
  }, [
    debouncedSearchTerm,
    selectedTypes,
    selectedStatus,
    timeFilter,
    startDate,
    endDate,
    requiresRegistrationOnly,
    availableOnly,
    myEventsOnly,
    upcomingOnly,
  ]);

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {title && <h2 className='text-2xl font-bold'>{title}</h2>}
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
      {/* Header with title and action buttons */}
      {title && (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h2 className='text-2xl font-bold'>{title}</h2>
            {filteredAndSortedEvents.length > 0 && (
              <Badge variant='secondary' className='text-sm'>
                {filteredAndSortedEvents.length} evento
                {filteredAndSortedEvents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className='flex items-center gap-2'>
            {/* Action buttons */}
            {showRefresh && onRefresh && (
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

            {showExport && onExport && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onExport(filteredAndSortedEvents)}
                disabled={filteredAndSortedEvents.length === 0}
                aria-label='Exportar eventos'
              >
                <Download className='w-4 h-4' />
              </Button>
            )}

            {showShare && onShare && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => onShare(filteredAndSortedEvents)}
                disabled={filteredAndSortedEvents.length === 0}
                aria-label='Compartir eventos'
              >
                <Share2 className='w-4 h-4' />
              </Button>
            )}

            {showViewToggle && (
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
            )}
          </div>
        </div>
      )}

      {/* Search and filters */}
      {(showSearch || showFilters) && (
        <div className='space-y-4'>
          {/* Search bar */}
          {showSearch && (
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar eventos por título, descripción, ubicación o grupo organizador...'
                value={searchQuery ?? searchTerm}
                onChange={e => {
                  const value = e.target.value;
                  if (onSearch) {
                    onSearch(value);
                  } else {
                    setSearchTerm(value);
                  }
                }}
                className='pl-10'
                aria-label='Buscar eventos'
              />
            </div>
          )}

          {/* Quick filters */}
          {enableQuickFilters && (
            <div className='space-y-2'>
              <div className='text-sm font-medium text-muted-foreground'>
                Filtros rápidos:
              </div>
              <div className='flex flex-wrap gap-2'>
                {QUICK_FILTERS.map(filter => {
                  const Icon = filter.icon;
                  const isActive = activeQuickFilter === filter.id;

                  return (
                    <Button
                      key={filter.id}
                      variant={isActive ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => handleQuickFilter(filter.id)}
                      className='flex items-center gap-2 text-xs'
                      title={filter.description}
                    >
                      <Icon className='w-3 h-3' />
                      {filter.label}
                      {isActive && <X className='w-3 h-3' />}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters row */}
          {showFilters && (
            <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
              {/* Filter toggle button for mobile */}
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

              {/* Desktop filters */}
              <div
                className={`flex flex-wrap gap-2 ${showFiltersPanel ? 'block' : 'hidden sm:flex'}`}
              >
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

                {/* Time filter dropdown */}
                <Select
                  value={timeFilter}
                  onValueChange={value => {
                    if (onFilterChange) {
                      // Map time filter to date range
                      const now = new Date();
                      let startDate = '';
                      let endDate = '';

                      switch (value) {
                        case 'today':
                          startDate = now.toISOString().split('T')[0];
                          endDate = now.toISOString().split('T')[0];
                          break;
                        case 'tomorrow':
                          const tomorrow = new Date(now);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          startDate = tomorrow.toISOString().split('T')[0];
                          endDate = tomorrow.toISOString().split('T')[0];
                          break;
                        case 'this_week':
                          const startOfWeek = new Date(now);
                          startOfWeek.setDate(now.getDate() - now.getDay());
                          const endOfWeek = new Date(startOfWeek);
                          endOfWeek.setDate(startOfWeek.getDate() + 6);
                          startDate = startOfWeek.toISOString().split('T')[0];
                          endDate = endOfWeek.toISOString().split('T')[0];
                          break;
                        case 'next_week':
                          const nextWeekStart = new Date(now);
                          nextWeekStart.setDate(
                            now.getDate() - now.getDay() + 7
                          );
                          const nextWeekEnd = new Date(nextWeekStart);
                          nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
                          startDate = nextWeekStart.toISOString().split('T')[0];
                          endDate = nextWeekEnd.toISOString().split('T')[0];
                          break;
                        case 'this_month':
                          const startOfMonth = new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            1
                          );
                          const endOfMonth = new Date(
                            now.getFullYear(),
                            now.getMonth() + 1,
                            0
                          );
                          startDate = startOfMonth.toISOString().split('T')[0];
                          endDate = endOfMonth.toISOString().split('T')[0];
                          break;
                        case 'next_month':
                          const nextMonthStart = new Date(
                            now.getFullYear(),
                            now.getMonth() + 1,
                            1
                          );
                          const nextMonthEnd = new Date(
                            now.getFullYear(),
                            now.getMonth() + 2,
                            0
                          );
                          startDate = nextMonthStart
                            .toISOString()
                            .split('T')[0];
                          endDate = nextMonthEnd.toISOString().split('T')[0];
                          break;
                      }

                      onFilterChange({
                        start_date: startDate || undefined,
                        end_date: endDate || undefined,
                      });
                    } else {
                      setTimeFilter(value);
                    }
                  }}
                >
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

                {/* Status filter dropdown */}
                <Select
                  value={selectedStatus}
                  onValueChange={value => {
                    if (onFilterChange) {
                      onFilterChange({
                        status: value === 'all' ? undefined : value,
                      });
                    } else {
                      setSelectedStatus(value);
                    }
                  }}
                >
                  <SelectTrigger className='w-[140px]'>
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
          )}

          {/* Advanced filters panel */}
          {showFilters && (
            <div
              className={`space-y-4 ${showFiltersPanel ? 'block' : 'hidden sm:block'}`}
            >
              {/* Event type filters */}
              <div className='space-y-2'>
                <div className='text-sm font-medium text-muted-foreground'>
                  Tipos de evento:
                </div>
                <div className='flex flex-wrap gap-2'>
                  {EVENT_TYPES.map(type => (
                    <Button
                      key={type.value}
                      variant={
                        selectedTypes.includes(type.value)
                          ? 'default'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() => handleTypeToggle(type.value)}
                      className='text-xs'
                    >
                      {type.label}
                      {selectedTypes.includes(type.value) &&
                        type.value !== 'all' && <X className='w-3 h-3 ml-1' />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date range filters */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-medium text-muted-foreground'>
                    Rango de fechas:
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowDateRange(!showDateRange)}
                    className='flex items-center gap-2 text-xs'
                  >
                    <CalendarDays className='w-3 h-3' />
                    {showDateRange ? 'Ocultar' : 'Mostrar'} calendario
                  </Button>
                </div>

                {showDateRange && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                        <Calendar className='w-4 h-4' />
                        Desde:
                      </label>
                      <Input
                        type='date'
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className='w-full'
                        min={new Date().toISOString().split('T')[0]}
                        aria-label='Fecha de inicio del rango'
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
                        <Calendar className='w-4 h-4' />
                        Hasta:
                      </label>
                      <Input
                        type='date'
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className='w-full'
                        min={
                          startDate || new Date().toISOString().split('T')[0]
                        }
                        aria-label='Fecha de fin del rango'
                      />
                    </div>
                    {(startDate || endDate) && (
                      <div className='col-span-full flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => {
                            setStartDate('');
                            setEndDate('');
                          }}
                          className='text-xs'
                        >
                          <X className='w-3 h-3 mr-1' />
                          Limpiar fechas
                        </Button>
                        {(startDate || endDate) && (
                          <span className='text-xs text-muted-foreground'>
                            {startDate && endDate
                              ? `Mostrando eventos del ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}`
                              : startDate
                                ? `Mostrando eventos desde el ${new Date(startDate).toLocaleDateString('es-ES')}`
                                : `Mostrando eventos hasta el ${new Date(endDate).toLocaleDateString('es-ES')}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Additional filter toggles */}
              <div className='flex flex-wrap items-center gap-4'>
                <label className='flex items-center gap-2 text-sm cursor-pointer'>
                  <Checkbox
                    checked={requiresRegistrationOnly}
                    onCheckedChange={checked =>
                      setRequiresRegistrationOnly(checked === true)
                    }
                  />
                  Solo con registro
                </label>
                <label className='flex items-center gap-2 text-sm cursor-pointer'>
                  <Checkbox
                    checked={availableOnly}
                    onCheckedChange={checked =>
                      setAvailableOnly(checked === true)
                    }
                  />
                  Solo disponibles
                </label>
                <label className='flex items-center gap-2 text-sm cursor-pointer'>
                  <Checkbox
                    checked={myEventsOnly}
                    onCheckedChange={checked =>
                      setMyEventsOnly(checked === true)
                    }
                  />
                  Mis eventos
                </label>
                <label className='flex items-center gap-2 text-sm cursor-pointer'>
                  <Checkbox
                    checked={upcomingOnly}
                    onCheckedChange={checked =>
                      setUpcomingOnly(checked === true)
                    }
                  />
                  Solo próximos
                </label>
              </div>
            </div>
          )}

          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Filter className='w-4 h-4' />
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}{' '}
              activo{activeFiltersCount > 1 ? 's' : ''}
              {!selectedTypes.includes('all') && (
                <span>
                  • Tipos:{' '}
                  {selectedTypes
                    .map(
                      type =>
                        EVENT_TYPE_LABELS[
                          type as keyof typeof EVENT_TYPE_LABELS
                        ]
                    )
                    .join(', ')}
                </span>
              )}
              {timeFilter !== 'all' && (
                <span>
                  • Tiempo:{' '}
                  {TIME_FILTERS.find(f => f.value === timeFilter)?.label}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className='text-center py-12'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
            <Calendar className='w-8 h-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>
            No se encontraron eventos
          </h3>
          <p className='text-muted-foreground mb-4'>
            {activeFiltersCount > 0
              ? 'Intenta ajustar los filtros de búsqueda'
              : emptyMessage}
          </p>
          {activeFiltersCount > 0 && (
            <Button variant='outline' onClick={clearAllFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Events grid/list */}
          <div
            className={
              viewMode === 'grid'
                ? `grid grid-cols-1 ${variant === 'compact' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`
                : 'space-y-4'
            }
          >
            {paginatedEvents.map(event => (
              <EventCard
                key={event.event_id}
                event={event}
                variant={viewMode === 'list' ? 'compact' : variant}
                onRegister={onRegister}
                onUnregister={onUnregister}
                onView={onView}
                onManage={onManage}
              />
            ))}
          </div>

          {/* Pagination */}
          {enablePagination && totalPages > 1 && (
            <div className='flex items-center justify-between'>
              <div className='text-sm text-muted-foreground'>
                Mostrando {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedEvents.length
                )}{' '}
                de {filteredAndSortedEvents.length} eventos
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={!hasPrevPage}
                  aria-label='Página anterior'
                >
                  <ChevronLeft className='w-4 h-4' />
                </Button>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setCurrentPage(pageNum)}
                        className='w-8 h-8 p-0'
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={!hasNextPage}
                  aria-label='Página siguiente'
                >
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}

          {/* Results summary */}
          {!enablePagination && (
            <div className='text-center text-sm text-muted-foreground'>
              Mostrando {filteredAndSortedEvents.length} de{' '}
              {events?.length || 0} eventos
            </div>
          )}
        </>
      )}
    </div>
  );
}
