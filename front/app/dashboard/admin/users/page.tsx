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
  Edit,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
} from 'lucide-react';
import { usersApi, User } from '@/lib/api/users';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getAllUsers();
      // Ensure data is an array
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('API returned non-array data:', data);
        setUsers([]);
        toast({
          title: 'Error',
          description: 'Los datos recibidos no son válidos',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Set empty array on error
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await usersApi.deleteUser(userId);
      toast({
        title: 'Éxito',
        description: 'Usuario eliminado correctamente',
      });
      loadUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await usersApi.updateUserStatus(userId, !isActive);
      toast({
        title: 'Éxito',
        description: `Usuario ${!isActive ? 'activado' : 'desactivado'} correctamente`,
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.student_id &&
        user.student_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Gestión de Usuarios'
          description='Administrar usuarios del sistema'
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
        title='Gestión de Usuarios'
        description='Administrar usuarios del sistema'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Header Actions */}
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div className='flex flex-col sm:flex-row gap-4 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Buscar usuarios...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Rol' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los roles</SelectItem>
                <SelectItem value='student'>Estudiante</SelectItem>
                <SelectItem value='president'>Presidente</SelectItem>
                <SelectItem value='admin'>Administrador</SelectItem>
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
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Total Usuarios
                  </p>
                  <p className='text-2xl font-bold'>{(users || []).length}</p>
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
                    Estudiantes
                  </p>
                  <p className='text-2xl font-bold'>
                    {(users || []).filter(u => u.role === 'student').length}
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
                    Presidentes
                  </p>
                  <p className='text-2xl font-bold'>
                    {(users || []).filter(u => u.role === 'president').length}
                  </p>
                </div>
                <Shield className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Administradores
                  </p>
                  <p className='text-2xl font-bold'>
                    {(users || []).filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Shield className='w-8 h-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredUsers.map(user => (
            <Card key={user.id} className='hover:shadow-md transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>
                      {user.first_name} {user.last_name}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {user.student_id || 'Sin matrícula'}
                    </p>
                  </div>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='w-4 h-4 text-muted-foreground' />
                    <span className='truncate'>{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Phone className='w-4 h-4 text-muted-foreground' />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  <div className='flex items-center justify-between text-sm'>
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'destructive'
                          : user.role === 'president'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'president'
                          ? 'Presidente'
                          : 'Estudiante'}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(user.date_joined).toLocaleDateString()}
                    </span>
                  </div>

                  <div className='flex gap-2 pt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        router.push(`/dashboard/admin/users/${user.id}`)
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
                        router.push(`/dashboard/admin/users/${user.id}/edit`)
                      }
                      className='flex-1'
                    >
                      <Edit className='w-4 h-4 mr-1' />
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant={user.is_active ? 'destructive' : 'default'}
                      onClick={() =>
                        handleToggleUserStatus(user.id, user.is_active)
                      }
                    >
                      {user.is_active ? (
                        <UserX className='w-4 h-4' />
                      ) : (
                        <UserCheck className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className='text-center py-12'>
            <Users className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>
              No se encontraron usuarios
            </h3>
            <p className='text-muted-foreground mb-4'>
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay usuarios registrados en el sistema'}
            </p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar usuario?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente
                el usuario{' '}
                <strong>
                  {selectedUser?.first_name} {selectedUser?.last_name}
                </strong>{' '}
                y todos sus datos asociados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant='destructive'
                onClick={() =>
                  selectedUser && handleDeleteUser(selectedUser.id)
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
