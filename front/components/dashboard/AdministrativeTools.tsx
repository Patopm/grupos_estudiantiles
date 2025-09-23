'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Calendar,
  Settings,
  Trash2,
  Edit,
  Plus,
  Search,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';

interface AdministrativeToolsProps {
  toolsData: {
    groups: {
      total: number;
      active: number;
      pending: number;
      recent: RecentItem[];
    };
    events: {
      total: number;
      published: number;
      draft: number;
      cancelled: number;
      recent: RecentItem[];
    };
    users: {
      total: number;
      students: number;
      presidents: number;
      admins: number;
      recent: RecentItem[];
    };
  };
}

type RecentItem = {
  group_id?: string;
  event_id?: string;
  id?: number;
  name?: string;
  title?: string;
  full_name?: string;
  email?: string;
  role?: string;
  category?: string;
  member_count?: number;
  president_name?: string;
  status: string;
  created_at: string;
  start_datetime?: string;
  group_name?: string;
  attendee_count?: number;
  last_login?: string;
};

export default function AdministrativeTools({
  toolsData,
}: AdministrativeToolsProps) {
  const [selectedTool, setSelectedTool] = useState<
    'groups' | 'events' | 'users' | 'system'
  >('groups');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    name: string;
    title: string;
    full_name: string;
    email: string;
    role: string;
    status: string;
  } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'president':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = () => {
    let data: RecentItem[] = [];
    switch (selectedTool) {
      case 'groups':
        data = toolsData.groups.recent;
        break;
      case 'events':
        data = toolsData.events.recent;
        break;
      case 'users':
        data = toolsData.users.recent;
        break;
      default:
        data = [];
    }

    return data.filter(item => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === 'all' || item.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Herramientas Administrativas</h2>
          <p className='text-muted-foreground'>
            Gestión completa de grupos, eventos y usuarios del sistema
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm'>
            <Download className='w-4 h-4 mr-2' />
            Exportar
          </Button>
          <Button variant='outline' size='sm'>
            <Upload className='w-4 h-4 mr-2' />
            Importar
          </Button>
          <Button variant='outline' size='sm'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tool Selector */}
      <div className='flex gap-2'>
        {(['groups', 'events', 'users', 'system'] as const).map(tool => (
          <Button
            key={tool}
            variant={selectedTool === tool ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedTool(tool)}
          >
            {tool === 'groups'
              ? 'Grupos'
              : tool === 'events'
                ? 'Eventos'
                : tool === 'users'
                  ? 'Usuarios'
                  : 'Sistema'}
          </Button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder={`Buscar ${selectedTool}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='Filtrar por estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los estados</SelectItem>
            <SelectItem value='active'>Activo</SelectItem>
            <SelectItem value='pending'>Pendiente</SelectItem>
            <SelectItem value='inactive'>Inactivo</SelectItem>
            <SelectItem value='draft'>Borrador</SelectItem>
            <SelectItem value='published'>Publicado</SelectItem>
            <SelectItem value='cancelled'>Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='w-4 h-4 mr-2' />
              Crear{' '}
              {selectedTool === 'groups'
                ? 'Grupo'
                : selectedTool === 'events'
                  ? 'Evento'
                  : 'Usuario'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Crear{' '}
                {selectedTool === 'groups'
                  ? 'Nuevo Grupo'
                  : selectedTool === 'events'
                    ? 'Nuevo Evento'
                    : 'Nuevo Usuario'}
              </DialogTitle>
              <DialogDescription>
                Complete la información para crear un nuevo{' '}
                {selectedTool === 'groups'
                  ? 'grupo estudiantil'
                  : selectedTool === 'events'
                    ? 'evento'
                    : 'usuario'}
                .
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              {selectedTool === 'groups' && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Nombre del Grupo</Label>
                    <Input id='name' placeholder='Nombre del grupo' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='category'>Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccionar categoría' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='academic'>Académico</SelectItem>
                        <SelectItem value='cultural'>Cultural</SelectItem>
                        <SelectItem value='sports'>Deportivo</SelectItem>
                        <SelectItem value='social'>Social</SelectItem>
                        <SelectItem value='technical'>Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='description'>Descripción</Label>
                    <Textarea
                      id='description'
                      placeholder='Descripción del grupo'
                    />
                  </div>
                </>
              )}
              {selectedTool === 'events' && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Título del Evento</Label>
                    <Input id='title' placeholder='Título del evento' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='group'>Grupo</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccionar grupo' />
                      </SelectTrigger>
                      <SelectContent>
                        {toolsData.groups.recent.map(group => (
                          <SelectItem
                            key={group.group_id || 'unknown'}
                            value={group.group_id || 'unknown'}
                          >
                            {group.name || 'Sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='datetime'>Fecha y Hora</Label>
                    <Input id='datetime' type='datetime-local' />
                  </div>
                </>
              )}
              {selectedTool === 'users' && (
                <>
                  <div className='space-y-2'>
                    <Label htmlFor='fullName'>Nombre Completo</Label>
                    <Input id='fullName' placeholder='Nombre completo' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='email@ejemplo.com'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='role'>Rol</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccionar rol' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='student'>Estudiante</SelectItem>
                        <SelectItem value='president'>Presidente</SelectItem>
                        <SelectItem value='admin'>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {selectedTool === 'groups' && <Users className='w-5 h-5' />}
            {selectedTool === 'events' && <Calendar className='w-5 h-5' />}
            {selectedTool === 'users' && <Users className='w-5 h-5' />}
            {selectedTool === 'system' && <Settings className='w-5 h-5' />}
            {selectedTool === 'groups'
              ? 'Gestión de Grupos'
              : selectedTool === 'events'
                ? 'Gestión de Eventos'
                : selectedTool === 'users'
                  ? 'Gestión de Usuarios'
                  : 'Configuración del Sistema'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredData().map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                    {selectedTool === 'groups' && (
                      <Users className='w-5 h-5 text-primary' />
                    )}
                    {selectedTool === 'events' && (
                      <Calendar className='w-5 h-5 text-primary' />
                    )}
                    {selectedTool === 'users' && (
                      <Users className='w-5 h-5 text-primary' />
                    )}
                  </div>
                  <div>
                    <p className='font-medium'>
                      {item.name ||
                        item.title ||
                        item.full_name ||
                        'Sin nombre'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {selectedTool === 'groups' &&
                        `${item.category} • ${item.member_count} miembros`}
                      {selectedTool === 'events' &&
                        `${item.group_name} • ${item.start_datetime ? new Date(item.start_datetime).toLocaleDateString() : 'Sin fecha'}`}
                      {selectedTool === 'users' &&
                        `${item.email} • ${item.role}`}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Badge
                    className={
                      selectedTool === 'users'
                        ? getRoleColor(item.role || 'student')
                        : getStatusColor(item.status)
                    }
                  >
                    {selectedTool === 'users'
                      ? item.role || 'Sin rol'
                      : item.status}
                  </Badge>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setSelectedItem({
                          name: item.name || '',
                          title: item.title || '',
                          full_name: item.full_name || '',
                          email: item.email || '',
                          role: item.role || '',
                          status: item.status,
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        // Handle delete
                      }}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredData().length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Search className='w-12 h-12 mx-auto mb-4' />
                <p>No se encontraron resultados</p>
                <p className='text-sm'>
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar{' '}
              {selectedTool === 'groups'
                ? 'Grupo'
                : selectedTool === 'events'
                  ? 'Evento'
                  : 'Usuario'}
            </DialogTitle>
            <DialogDescription>
              Modifique la información del{' '}
              {selectedTool === 'groups'
                ? 'grupo'
                : selectedTool === 'events'
                  ? 'evento'
                  : 'usuario'}{' '}
              seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            {selectedItem && (
              <>
                <div className='space-y-2'>
                  <Label htmlFor='editName'>Nombre</Label>
                  <Input
                    id='editName'
                    defaultValue={
                      selectedItem.name ||
                      selectedItem.title ||
                      selectedItem.full_name
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='editStatus'>Estado</Label>
                  <Select defaultValue={selectedItem.status}>
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar estado' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Activo</SelectItem>
                      <SelectItem value='inactive'>Inactivo</SelectItem>
                      <SelectItem value='pending'>Pendiente</SelectItem>
                      <SelectItem value='draft'>Borrador</SelectItem>
                      <SelectItem value='published'>Publicado</SelectItem>
                      <SelectItem value='cancelled'>Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
