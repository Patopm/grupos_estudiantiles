'use client';

import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid,
  List,
  Search,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import type { Group } from '@/lib/api/groups';
import GroupCard from './GroupCard';

interface GroupListProps {
  groups: Group[];
  title?: string;
  label?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  variant?: 'default' | 'compact';
  noGroupsMessage?: string;
  noGroupsAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  viewAllAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
    showWhen?: boolean;
  };
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onView?: (groupId: string) => void;
  onManage?: (groupId: string) => void;
  isLoading?: boolean;
  enablePagination?: boolean;
  itemsPerPage?: number;
}

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'deportivo', label: 'Deportivo' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'academico', label: 'Académico' },
  { value: 'tecnologico', label: 'Tecnológico' },
  { value: 'social', label: 'Social' },
  { value: 'otro', label: 'Otro' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Nombre A-Z', icon: null },
  { value: 'name_desc', label: 'Nombre Z-A', icon: null },
  { value: 'members', label: 'Más Miembros', icon: Users },
  { value: 'members_desc', label: 'Menos Miembros', icon: Users },
  { value: 'recent', label: 'Más Recientes', icon: Calendar },
  { value: 'oldest', label: 'Más Antiguos', icon: Calendar },
  { value: 'popularity', label: 'Más Populares', icon: TrendingUp },
];

export default function GroupList({
  groups,
  title,
  label,
  showSearch = true,
  showFilters = true,
  showViewToggle = false,
  variant = 'default',
  noGroupsMessage = 'No tienes grupos registrados',
  noGroupsAction,
  viewAllAction,
  onJoin,
  onLeave,
  onView,
  onManage,
  isLoading = false,
  enablePagination = true,
  itemsPerPage = 12,
}: GroupListProps) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'all',
  ]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Additional filters
  const [hasSpaceOnly, setHasSpaceOnly] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered and sorted groups
  const filteredAndSortedGroups = useMemo(() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) return [];

    let filtered = [...groups];

    // Filter by search term (debounced)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        group =>
          group.name.toLowerCase().includes(searchLower) ||
          group.description.toLowerCase().includes(searchLower) ||
          group.president_name.toLowerCase().includes(searchLower) ||
          group.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by categories (multi-select)
    if (!selectedCategories.includes('all') && selectedCategories.length > 0) {
      filtered = filtered.filter(group =>
        selectedCategories.some(
          category => group.category.toLowerCase() === category.toLowerCase()
        )
      );
    }

    // Filter by availability
    if (hasSpaceOnly) {
      filtered = filtered.filter(
        group => group.member_count < group.max_members
      );
    }

    // Filter by active status
    if (activeOnly) {
      filtered = filtered.filter(group => group.is_active);
    }

    // Filter by membership status
    if (showPendingOnly) {
      filtered = filtered.filter(
        group => group.membership_status === 'pending'
      );
    } else if (showActiveOnly) {
      filtered = filtered.filter(group => group.membership_status === 'active');
    }

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'members':
          return b.member_count - a.member_count;
        case 'members_desc':
          return a.member_count - b.member_count;
        case 'recent':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case 'popularity':
          // Sort by member count as a proxy for popularity
          return b.member_count - a.member_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    groups,
    debouncedSearchTerm,
    selectedCategories,
    sortBy,
    hasSpaceOnly,
    activeOnly,
    showPendingOnly,
    showActiveOnly,
  ]);

  // Paginated groups
  const paginatedGroups = useMemo(() => {
    if (!enablePagination) return filteredAndSortedGroups;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedGroups.slice(startIndex, endIndex);
  }, [filteredAndSortedGroups, currentPage, itemsPerPage, enablePagination]);

  // Pagination info
  const totalPages = Math.ceil(filteredAndSortedGroups.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    selectedCategories,
    sortBy,
    hasSpaceOnly,
    activeOnly,
    showPendingOnly,
    showActiveOnly,
  ]);

  // Category selection handlers
  const handleCategoryToggle = useCallback((categoryValue: string) => {
    setSelectedCategories(prev => {
      if (categoryValue === 'all') {
        return ['all'];
      }

      const newCategories = prev.includes('all')
        ? [categoryValue]
        : prev.includes(categoryValue)
          ? prev.filter(c => c !== categoryValue)
          : [...prev.filter(c => c !== 'all'), categoryValue];

      return newCategories.length === 0 ? ['all'] : newCategories;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategories(['all']);
    setSortBy('name');
    setHasSpaceOnly(false);
    setActiveOnly(true);
    setShowPendingOnly(false);
    setShowActiveOnly(false);
    setCurrentPage(1);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm.trim()) count++;
    if (!selectedCategories.includes('all')) count++;
    if (hasSpaceOnly) count++;
    if (!activeOnly) count++;
    if (showPendingOnly) count++;
    if (showActiveOnly) count++;
    return count;
  }, [
    debouncedSearchTerm,
    selectedCategories,
    hasSpaceOnly,
    activeOnly,
    showPendingOnly,
    showActiveOnly,
  ]);

  if (isLoading) {
    return (
      <Card className='h-full'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            {label && (
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                {label}
              </CardTitle>
            )}
            {title && !label && <CardTitle>{title}</CardTitle>}
          </div>
        </CardHeader>
        <CardContent className='flex-1'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='animate-pulse'>
                <div className='bg-muted rounded-lg h-64'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          {label && (
            <CardTitle className='flex items-center gap-2'>
              <Users className='w-5 h-5' />
              {label}
            </CardTitle>
          )}
          {title && !label && <CardTitle>{title}</CardTitle>}
          {showViewToggle && (
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('grid')}
                aria-label='Vista de cuadrícula'
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('list')}
                aria-label='Vista de lista'
              >
                <List className='w-4 h-4' />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-6 flex-1'>
        {/* Search and filters */}
        {(showSearch || showFilters) && (
          <div className='space-y-4'>
            {/* Search bar */}
            {showSearch && (
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
                <Input
                  placeholder='Buscar grupos por nombre, descripción o presidente...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                  aria-label='Buscar grupos'
                />
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
                    <SelectTrigger className='w-[180px]'>
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

                  {/* Additional filter toggles */}
                  <div className='flex items-center gap-4'>
                    <label className='flex items-center gap-2 text-sm cursor-pointer'>
                      <Checkbox
                        checked={hasSpaceOnly}
                        onCheckedChange={checked =>
                          setHasSpaceOnly(checked === true)
                        }
                      />
                      Solo con cupos
                    </label>
                    <label className='flex items-center gap-2 text-sm cursor-pointer'>
                      <Checkbox
                        checked={activeOnly}
                        onCheckedChange={checked =>
                          setActiveOnly(checked === true)
                        }
                      />
                      Solo activos
                    </label>
                    <label className='flex items-center gap-2 text-sm cursor-pointer'>
                      <Checkbox
                        checked={showPendingOnly}
                        onCheckedChange={checked => {
                          setShowPendingOnly(checked === true);
                          if (checked) setShowActiveOnly(false);
                        }}
                      />
                      Solo pendientes
                    </label>
                    <label className='flex items-center gap-2 text-sm cursor-pointer'>
                      <Checkbox
                        checked={showActiveOnly}
                        onCheckedChange={checked => {
                          setShowActiveOnly(checked === true);
                          if (checked) setShowPendingOnly(false);
                        }}
                      />
                      Solo activos (miembros)
                    </label>
                  </div>

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

            {/* Category filters */}
            {showFilters && (
              <div
                className={`space-y-2 ${showFiltersPanel ? 'block' : 'hidden sm:block'}`}
              >
                <div className='text-sm font-medium text-muted-foreground'>
                  Categorías:
                </div>
                <div className='flex flex-wrap gap-2'>
                  {CATEGORIES.map(category => (
                    <Button
                      key={category.value}
                      variant={
                        selectedCategories.includes(category.value)
                          ? 'default'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() => handleCategoryToggle(category.value)}
                      className='text-xs'
                    >
                      {category.label}
                      {selectedCategories.includes(category.value) &&
                        category.value !== 'all' && (
                          <X className='w-3 h-3 ml-1' />
                        )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Active filters summary */}
            {activeFiltersCount > 0 && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Filter className='w-4 h-4' />
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}{' '}
                activo{activeFiltersCount > 1 ? 's' : ''}
                {!selectedCategories.includes('all') && (
                  <span>• Categorías: {selectedCategories.join(', ')}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {filteredAndSortedGroups.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto flex items-center justify-center'>
              {activeFiltersCount > 0 || debouncedSearchTerm.trim() ? (
                <Search className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              ) : (
                <Users className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              )}
            </div>
            <h3 className='text-lg font-semibold mb-2'>
              {activeFiltersCount > 0 || debouncedSearchTerm.trim()
                ? 'No se encontraron grupos'
                : 'No tienes grupos registrados'}
            </h3>
            <p className='text-muted-foreground mb-4'>
              {activeFiltersCount > 0 || debouncedSearchTerm.trim()
                ? 'Intenta ajustar los filtros de búsqueda'
                : noGroupsMessage}
            </p>
            <div className='flex flex-col sm:flex-row gap-2 justify-center'>
              {activeFiltersCount > 0 && (
                <Button variant='outline' onClick={clearAllFilters}>
                  Limpiar filtros
                </Button>
              )}
              {!activeFiltersCount &&
                !debouncedSearchTerm.trim() &&
                noGroupsAction && (
                  <>
                    {noGroupsAction.href ? (
                      <Button asChild>
                        <a href={noGroupsAction.href}>{noGroupsAction.label}</a>
                      </Button>
                    ) : (
                      <Button onClick={noGroupsAction.onClick}>
                        {noGroupsAction.label}
                      </Button>
                    )}
                  </>
                )}
            </div>
          </div>
        ) : (
          <>
            {/* Groups grid/list */}
            <div
              className={
                viewMode === 'grid'
                  ? `grid grid-cols-1 ${variant === 'compact' ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`
                  : 'space-y-4'
              }
            >
              {paginatedGroups.map(group => (
                <GroupCard
                  key={group.group_id}
                  group={group}
                  variant={viewMode === 'list' ? 'compact' : variant}
                  onJoin={onJoin}
                  onLeave={onLeave}
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
                    filteredAndSortedGroups.length
                  )}{' '}
                  de {filteredAndSortedGroups.length} grupos
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
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
                Mostrando {filteredAndSortedGroups.length} de{' '}
                {groups?.length || 0} grupos
              </div>
            )}

            {/* View All Action */}
            {viewAllAction && viewAllAction.showWhen && (
              <div className='flex justify-center pt-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={viewAllAction.onClick}
                  className='text-xs px-4 py-2 hover:bg-muted/50'
                >
                  {viewAllAction.label}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
