'use client';

import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}

function StudentDashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className='min-h-screen bg-background'>
      <nav className='px-6 py-4 border-b'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <div className='text-2xl font-bold text-primary'>
            Dashboard Estudiante
          </div>
          <div className='flex items-center gap-4'>
            <span className='text-sm text-muted-foreground'>
              Bienvenido, {user?.first_name}
            </span>
            <Button variant='outline' onClick={logout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      <div className='max-w-7xl mx-auto p-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold mb-2'>
            ¡Hola, {user?.first_name}!
          </h1>
          <p className='text-muted-foreground'>
            Bienvenido a tu dashboard de estudiante. Aquí podrás gestionar tus
            grupos y eventos.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Mis Grupos</h3>
            <p className='text-muted-foreground mb-4'>
              Gestiona tus grupos estudiantiles
            </p>
            <Button>Ver Grupos</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Eventos</h3>
            <p className='text-muted-foreground mb-4'>
              Próximos eventos y actividades
            </p>
            <Button>Ver Eventos</Button>
          </div>

          <div className='p-6 border rounded-lg'>
            <h3 className='text-xl font-semibold mb-2'>Explorar</h3>
            <p className='text-muted-foreground mb-4'>
              Descubre nuevos grupos estudiantiles
            </p>
            <Button>Explorar</Button>
          </div>
        </div>

        <div className='mt-8 p-6 bg-primary/5 rounded-lg'>
          <h2 className='text-xl font-semibold mb-2'>Información de Usuario</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Matrícula:</strong> {user?.student_id}
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
