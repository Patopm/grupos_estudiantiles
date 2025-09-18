'use client';

import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import UserMenu from '@/components/dashboard/UserMenu';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();

  return (
    <div className='min-h-screen bg-background'>
      <nav className='px-6 py-4 border-b'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <div className='text-2xl font-bold text-primary'>
            Dashboard Administrador
          </div>
          <UserMenu />
        </div>
      </nav>

      <div className='max-w-7xl mx-auto p-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>
            ¡Hola, {user?.first_name}!
          </h1>
          <p className='text-muted-foreground'>
            Bienvenido al panel de administración. Aquí podrás gestionar todo el
            sistema.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Usuarios</h3>
            <p className='text-muted-foreground mb-4'>
              Gestionar usuarios del sistema
            </p>
            <Button>Gestionar Usuarios</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Grupos</h3>
            <p className='text-muted-foreground mb-4'>
              Administrar grupos estudiantiles
            </p>
            <Button>Gestionar Grupos</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Eventos</h3>
            <p className='text-muted-foreground mb-4'>
              Supervisar eventos del sistema
            </p>
            <Button>Gestionar Eventos</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Reportes</h3>
            <p className='text-muted-foreground mb-4'>
              Estadísticas y reportes globales
            </p>
            <Button>Ver Reportes</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Configuración</h3>
            <p className='text-muted-foreground mb-4'>
              Configuraciones del sistema
            </p>
            <Button>Configurar</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Auditoría</h3>
            <p className='text-muted-foreground mb-4'>
              Logs y auditoría del sistema
            </p>
            <Button>Ver Logs</Button>
          </div>
        </div>

        <div className='mt-8 p-6 bg-primary/5 rounded-lg'>
          <h2 className='text-xl font-semibold mb-2'>Información de Usuario</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Matrícula:</strong> {user?.student_id || 'N/A'}
            </div>
            <div>
              <strong>Teléfono:</strong> {user?.phone}
            </div>
            <div>
              <strong>Rol:</strong> {user?.role_display}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
