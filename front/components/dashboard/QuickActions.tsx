'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  Search,
  Plus,
  Settings,
  BarChart3,
  UserPlus,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  variant?: 'default' | 'secondary' | 'outline';
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  onClick,
  badge,
}: QuickActionProps) {
  const content = (
    <Card className='hover:shadow-md transition-shadow cursor-pointer group'>
      <CardContent className='p-6'>
        <div className='flex items-start gap-4'>
          <div className='p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors'>
            {icon}
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <h3 className='font-semibold'>{title}</h3>
              {badge && (
                <Badge variant='secondary' className='text-xs'>
                  {badge}
                </Badge>
              )}
            </div>
            <p className='text-sm text-muted-foreground'>{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <div onClick={onClick}>{content}</div>;
}

interface StudentQuickActionsProps {
  pendingRequests?: number;
  upcomingEvents?: number;
}

export function StudentQuickActions({
  pendingRequests = 0,
  upcomingEvents = 0,
}: StudentQuickActionsProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Acciones Rápidas</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <QuickActionCard
          title='Mis Grupos'
          description='Ver y gestionar los grupos en los que participo'
          icon={<Users className='w-5 h-5' />}
          href='/dashboard/student/groups'
        />
        <QuickActionCard
          title='Explorar Grupos'
          description='Descubre nuevos grupos estudiantiles'
          icon={<Search className='w-5 h-5' />}
          href='/dashboard/student/explore'
        />
        <QuickActionCard
          title='Próximos Eventos'
          description='Ver eventos de mis grupos'
          icon={<Calendar className='w-5 h-5' />}
          href='/dashboard/student/events'
          badge={upcomingEvents > 0 ? upcomingEvents : undefined}
        />
        <QuickActionCard
          title='Solicitudes'
          description='Estado de mis solicitudes de ingreso'
          icon={<ClipboardList className='w-5 h-5' />}
          href='/dashboard/student/requests'
          badge={pendingRequests > 0 ? pendingRequests : undefined}
        />
      </div>
    </div>
  );
}

interface PresidentQuickActionsProps {
  pendingRequests?: number;
  groupsManaged?: number;
}

export function PresidentQuickActions({
  pendingRequests = 0,
  groupsManaged = 0,
}: PresidentQuickActionsProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Gestión de Grupos</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <QuickActionCard
          title='Mis Grupos'
          description='Gestionar grupos bajo mi presidencia'
          icon={<Users className='w-5 h-5' />}
          href='/dashboard/president/groups'
          badge={groupsManaged > 0 ? groupsManaged : undefined}
        />
        <QuickActionCard
          title='Solicitudes Pendientes'
          description='Aprobar o rechazar solicitudes de ingreso'
          icon={<UserPlus className='w-5 h-5' />}
          href='/dashboard/president/requests'
          badge={pendingRequests > 0 ? pendingRequests : undefined}
        />
        <QuickActionCard
          title='Crear Evento'
          description='Organizar un nuevo evento para el grupo'
          icon={<Plus className='w-5 h-5' />}
          href='/dashboard/president/events/new'
        />
        <QuickActionCard
          title='Gestionar Eventos'
          description='Ver y administrar eventos creados'
          icon={<Calendar className='w-5 h-5' />}
          href='/dashboard/president/events'
        />
        <QuickActionCard
          title='Miembros'
          description='Gestionar miembros de mis grupos'
          icon={<Settings className='w-5 h-5' />}
          href='/dashboard/president/members'
        />
        <QuickActionCard
          title='Estadísticas'
          description='Ver métricas y reportes del grupo'
          icon={<BarChart3 className='w-5 h-5' />}
          href='/dashboard/president/stats'
        />
      </div>
    </div>
  );
}

interface AdminQuickActionsProps {
  totalGroups?: number;
  totalUsers?: number;
}

export function AdminQuickActions({
  totalGroups = 0,
  totalUsers = 0,
}: AdminQuickActionsProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Administración del Sistema</h3>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <QuickActionCard
          title='Gestionar Grupos'
          description='CRUD completo de grupos estudiantiles'
          icon={<Users className='w-5 h-5' />}
          href='/dashboard/admin/groups'
          badge={totalGroups > 0 ? totalGroups : undefined}
        />
        <QuickActionCard
          title='Gestionar Usuarios'
          description='Administrar usuarios y roles'
          icon={<Settings className='w-5 h-5' />}
          href='/dashboard/admin/users'
          badge={totalUsers > 0 ? totalUsers : undefined}
        />
        <QuickActionCard
          title='Crear Grupo'
          description='Crear nuevo grupo estudiantil'
          icon={<Plus className='w-5 h-5' />}
          href='/dashboard/admin/groups/new'
        />
        <QuickActionCard
          title='Reportes'
          description='Analytics y estadísticas del sistema'
          icon={<BarChart3 className='w-5 h-5' />}
          href='/dashboard/admin/reports'
        />
        <QuickActionCard
          title='Eventos Globales'
          description='Ver todos los eventos del sistema'
          icon={<Calendar className='w-5 h-5' />}
          href='/dashboard/admin/events'
        />
        <QuickActionCard
          title='Configuración'
          description='Configurar parámetros del sistema'
          icon={<Settings className='w-5 h-5' />}
          href='/dashboard/admin/settings'
        />
      </div>
    </div>
  );
}
