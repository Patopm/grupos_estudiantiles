'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Grid, List } from 'lucide-react';
import { Group } from '@/lib/api/groups';
import GroupCard from './GroupCard';

interface GroupListProps {
  groups: Group[];
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  variant?: 'default' | 'compact';
  emptyMessage?: string;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onView?: (groupId: string) => void;
  onManage?: (groupId: string) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  'Todos',
  'Deportivo',
  'Cultural',
  'Académico',
  'Tecnológico',
  'Social',
];

export default function GroupList({
  groups,
  title,
  showSearch = true,
  showFilters = true,
  showViewToggle = false,
  variant = 'default',
  emptyMessage = 'No hay grupos disponibles',
  onJoin,
  onLeave,
  onView,
  onManage,
  isLoading = false,
}: GroupListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'recent'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups || []);

  useEffect(() => {
    console.log('groups', groups);
    if (!groups || !Array.isArray(groups) || groups.length === 0) return;
    let filtered = [...groups];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        group =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.president_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(group => group.category === selectedCategory);
    }

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.member_count - a.member_count;
        case 'recent':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredGroups(filtered);
  }, [groups, searchTerm, selectedCategory, sortBy]);

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
      {title && (
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>{title}</h2>
          {showViewToggle && (
            <div className='flex items-center gap-2'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('grid')}
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('list')}
              >
                <List className='w-4 h-4' />
              </Button>
            </div>
          )}
        </div>
      )}

      {(showSearch || showFilters) && (
        <div className='flex flex-col sm:flex-row gap-4'>
          {showSearch && (
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar grupos...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          )}

          {showFilters && (
            <div className='flex gap-2'>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'members' | 'recent') =>
                  setSortBy(value)
                }
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name'>Nombre</SelectItem>
                  <SelectItem value='members'>Miembros</SelectItem>
                  <SelectItem value='recent'>Más Recientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className='text-center py-12'>
          <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center'>
            <Search className='w-8 h-8 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>
            No se encontraron grupos
          </h3>
          <p className='text-muted-foreground'>
            {searchTerm || selectedCategory !== 'Todos'
              ? 'Intenta ajustar los filtros de búsqueda'
              : emptyMessage}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? `grid grid-cols-1 ${variant === 'compact' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`
              : 'space-y-4'
          }
        >
          {filteredGroups.map(group => (
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
      )}

      {filteredGroups.length > 0 && (
        <div className='text-center text-sm text-muted-foreground'>
          Mostrando {filteredGroups.length} de {groups?.length || 0} grupos
        </div>
      )}
    </div>
  );
}
