'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'info';
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 dark:border-green-800';
      case 'warning':
        return 'border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'border-blue-200 dark:border-blue-800';
      default:
        return '';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={`${getVariantStyles()}`}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <div className={`${getIconStyles()}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {description && (
          <p className='text-xs text-muted-foreground mt-1'>{description}</p>
        )}
        {trend && (
          <div className='flex items-center mt-2'>
            <Badge
              variant={trend.isPositive ? 'default' : 'secondary'}
              className='text-xs'
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </Badge>
            <span className='text-xs text-muted-foreground ml-2'>
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StudentStatsProps {
  stats: {
    total_groups: number;
    total_events_attended: number;
    pending_requests_count: number;
  };
}

export function StudentStats({ stats }: StudentStatsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <StatCard
        title='Mis Grupos'
        value={stats.total_groups}
        description='Grupos en los que participo'
        icon={<Users className='h-4 w-4' />}
        variant='info'
      />
      <StatCard
        title='Eventos Asistidos'
        value={stats.total_events_attended}
        description='Total de eventos a los que he asistido'
        icon={<CheckCircle className='h-4 w-4' />}
        variant='success'
      />
      <StatCard
        title='Solicitudes Pendientes'
        value={stats.pending_requests_count}
        description='Solicitudes de ingreso pendientes'
        icon={<Clock className='h-4 w-4' />}
        variant={stats.pending_requests_count > 0 ? 'warning' : 'default'}
      />
    </div>
  );
}

interface PresidentStatsProps {
  stats: {
    total_groups_managed: number;
    total_members: number;
    total_events_created: number;
    pending_requests_count: number;
  };
}

export function PresidentStats({ stats }: PresidentStatsProps) {
  console.log(stats);
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      <StatCard
        title='Grupos Gestionados'
        value={stats.total_groups_managed}
        description='Grupos bajo mi presidencia'
        icon={<Users className='h-4 w-4' />}
        variant='info'
      />
      <StatCard
        title='Total Miembros'
        value={stats.total_members}
        description='Miembros en todos mis grupos'
        icon={<UserCheck className='h-4 w-4' />}
        variant='success'
      />
      <StatCard
        title='Eventos Creados'
        value={stats.total_events_created}
        description='Eventos organizados'
        icon={<Calendar className='h-4 w-4' />}
        variant='info'
      />
      <StatCard
        title='Solicitudes Pendientes'
        value={stats.pending_requests_count}
        description='Requieren mi aprobación'
        icon={<AlertCircle className='h-4 w-4' />}
        variant={stats.pending_requests_count > 0 ? 'warning' : 'default'}
      />
    </div>
  );
}

interface AdminStatsProps {
  systemStats: {
    total_users: number;
    total_students: number;
    total_presidents: number;
    total_groups: number;
    active_groups: number;
    total_events: number;
    upcoming_events: number;
  };
  activitySummary: {
    new_users_this_week: number;
    new_groups_this_week: number;
    events_this_week: number;
    total_memberships: number;
  };
}

export function AdminStats({ systemStats, activitySummary }: AdminStatsProps) {
  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-4'>Estadísticas del Sistema</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            title='Total Usuarios'
            value={systemStats.total_users}
            description={`${systemStats.total_students} estudiantes, ${systemStats.total_presidents} presidentes`}
            icon={<Users className='h-4 w-4' />}
            variant='info'
          />
          <StatCard
            title='Grupos Estudiantiles'
            value={`${systemStats.active_groups}/${systemStats.total_groups}`}
            description='Grupos activos del total'
            icon={<UserCheck className='h-4 w-4' />}
            variant='success'
          />
          <StatCard
            title='Eventos'
            value={systemStats.total_events}
            description={`${systemStats.upcoming_events} próximos eventos`}
            icon={<Calendar className='h-4 w-4' />}
            variant='info'
          />
          <StatCard
            title='Membresías'
            value={activitySummary.total_memberships}
            description='Total de membresías activas'
            icon={<TrendingUp className='h-4 w-4' />}
            variant='success'
          />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-4'>Actividad de la Semana</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <StatCard
            title='Nuevos Usuarios'
            value={activitySummary.new_users_this_week}
            description='Registros esta semana'
            icon={<Users className='h-4 w-4' />}
            trend={{
              value: activitySummary.new_users_this_week,
              label: 'esta semana',
              isPositive: activitySummary.new_users_this_week > 0,
            }}
            variant='info'
          />
          <StatCard
            title='Nuevos Grupos'
            value={activitySummary.new_groups_this_week}
            description='Grupos creados esta semana'
            icon={<UserCheck className='h-4 w-4' />}
            trend={{
              value: activitySummary.new_groups_this_week,
              label: 'esta semana',
              isPositive: activitySummary.new_groups_this_week > 0,
            }}
            variant='success'
          />
          <StatCard
            title='Eventos'
            value={activitySummary.events_this_week}
            description='Eventos esta semana'
            icon={<Calendar className='h-4 w-4' />}
            trend={{
              value: activitySummary.events_this_week,
              label: 'esta semana',
              isPositive: activitySummary.events_this_week > 0,
            }}
            variant='warning'
          />
        </div>
      </div>
    </div>
  );
}
