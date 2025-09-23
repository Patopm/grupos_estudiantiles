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
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { groupsApi, Group } from '@/lib/api/groups';

export default function AdminGroupsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminGroupsContent />
    </ProtectedRoute>
  );
}

function AdminGroupsContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const data = await groupsApi.getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los grupos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await groupsApi.delete(groupId);
      toast({
        title: 'Éxito',
        description: 'Grupo eliminado correctamente',
      });
      loadGroups();
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el grupo',
        variant: 'destructive',
      });
    }
  };

  const filteredGroups = (groups || []).filter(group => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.president_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || group.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && group.is_active) ||
      (statusFilter === 'inactive' && !group.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set((groups || []).map(g => g.category)));

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Gestión de Grupos'
          description='Administrar grupos estudiantiles'
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
        title='Gestión de Grupos'
        description='Administrar grupos estudiantiles del sistema'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Header Actions */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div className='flex flex-col sm:flex-row gap-4 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar grupos...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Categoría' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                <SelectItem value='active'>Activos</SelectItem>
                <SelectItem value='inactive'>Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => router.push('/dashboard/admin/groups/new')}>
            <Plus className='w-4 h-4 mr-2' />
            Nuevo Grupo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Grupos
                  </p>
                  <p className='text-2xl font-bold'>{(groups || []).length}</p>
                </div>
                <Users className='w-8 h-8 text-primary' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Grupos Activos
                  </p>
                  <p className='text-2xl font-bold'>
                    {(groups || []).filter(g => g.is_active).length}
                  </p>
                </div>
                <UserCheck className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Miembros
                  </p>
                  <p className='text-2xl font-bold'>
                    {(groups || []).reduce((sum, g) => sum + g.member_count, 0)}
                  </p>
                </div>
                <TrendingUp className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Categorías
                  </p>
                  <p className='text-2xl font-bold'>{categories.length}</p>
                </div>
                <Calendar className='w-8 h-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredGroups.map(group => (
            <Card
              key={group.group_id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>{group.name}</CardTitle>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {group.category}
                    </p>
                  </div>
                  <Badge variant={group.is_active ? 'default' : 'secondary'}>
                    {group.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <p className='text-sm text-muted-foreground line-clamp-2'>
                    {group.description}
                  </p>

                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center gap-1'>
                      <UserCheck className='w-4 h-4 text-muted-foreground' />
                      <span>{group.president_name}</span>
                    </div>
                    <Badge variant='outline' className='text-xs'>
                      {group.member_count}/{group.max_members} miembros
                    </Badge>
                  </div>

                  <div className='text-xs text-muted-foreground'>
                    Creado: {new Date(group.created_at).toLocaleDateString()}
                  </div>

                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        router.push(`/dashboard/admin/groups/${group.group_id}`)
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
                          `/dashboard/admin/groups/${group.group_id}/edit`
                        )
                      }
                      className='flex-1'
                    >
                      <Edit className='w-4 h-4 mr-1' />
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => {
                        setSelectedGroup(group);
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

        {filteredGroups.length === 0 && (
          <div className='text-center py-12'>
            <Users className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              No se encontraron grupos
            </h3>
            <p className='text-muted-foreground mb-4'>
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay grupos registrados en el sistema'}
            </p>
            <Button onClick={() => router.push('/dashboard/admin/groups/new')}>
              <Plus className='w-4 h-4 mr-2' />
              Crear Primer Grupo
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar grupo?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el grupo <strong>{selectedGroup?.name}</strong> y todos sus
                datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedGroup(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant='destructive'
                onClick={() =>
                  selectedGroup && handleDeleteGroup(selectedGroup.group_id)
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
