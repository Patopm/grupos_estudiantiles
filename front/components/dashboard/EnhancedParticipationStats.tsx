'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Target,
  Award,
} from 'lucide-react';

interface ParticipationStats {
  total_groups: number;
  total_events_attended: number;
  total_events_registered: number;
  upcoming_events_count: number;
  pending_requests_count: number;
  activity_score: number;
}

interface EnhancedParticipationStatsProps {
  stats: ParticipationStats;
  isLoading?: boolean;
}

export default function EnhancedParticipationStats({
  stats,
  isLoading = false,
}: EnhancedParticipationStatsProps) {
  const getActivityLevel = (score: number) => {
    if (score >= 80)
      return { level: 'high', label: 'Muy Activo', color: 'text-green-600' };
    if (score >= 60)
      return { level: 'medium', label: 'Activo', color: 'text-blue-600' };
    if (score >= 40)
      return { level: 'low', label: 'Moderado', color: 'text-yellow-600' };
    return { level: 'minimal', label: 'Iniciando', color: 'text-gray-600' };
  };

  const getActivityBadgeColor = (score: number) => {
    if (score >= 80)
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 60)
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (score >= 40)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const activityLevel = getActivityLevel(stats.activity_score);

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='animate-pulse'>
                <div className='h-4 bg-muted rounded w-1/2 mb-2'></div>
                <div className='h-8 bg-muted rounded w-1/3'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Grupos Activos',
      value: stats.total_groups,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      description: 'Grupos en los que participas',
    },
    {
      title: 'Eventos Asistidos',
      value: stats.total_events_attended,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900',
      description: 'Eventos a los que has asistido',
    },
    {
      title: 'Eventos Registrados',
      value: stats.total_events_registered,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      description: 'Eventos para los que te has registrado',
    },
    {
      title: 'Próximos Eventos',
      value: stats.upcoming_events_count,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      description: 'Eventos próximos en tus grupos',
    },
    {
      title: 'Solicitudes Pendientes',
      value: stats.pending_requests_count,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      description: 'Solicitudes de ingreso pendientes',
    },
    {
      title: 'Puntuación de Actividad',
      value: `${stats.activity_score}%`,
      icon: Award,
      color: activityLevel.color,
      bgColor: getActivityBadgeColor(stats.activity_score),
      description: `Nivel: ${activityLevel.label}`,
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Activity Score Highlight */}
      <Card className='bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold mb-2'>
                Tu Actividad Estudiantil
              </h3>
              <p className='text-muted-foreground text-sm mb-4'>
                Mantente activo participando en grupos y eventos
              </p>
              <div className='flex items-center gap-2'>
                <Badge className={getActivityBadgeColor(stats.activity_score)}>
                  <Award className='w-3 h-3 mr-1' />
                  {activityLevel.label}
                </Badge>
                <span className='text-sm text-muted-foreground'>
                  {stats.activity_score}% de actividad
                </span>
              </div>
            </div>
            <div className='text-right'>
              <div className='text-3xl font-bold text-primary'>
                {stats.activity_score}%
              </div>
              <div className='text-sm text-muted-foreground'>
                Puntuación de Actividad
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className='hover:shadow-md transition-shadow'>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-bold'>{stat.value}</div>
                  </div>
                </div>
                <div>
                  <h4 className='font-semibold text-sm mb-1'>{stat.title}</h4>
                  <p className='text-xs text-muted-foreground'>
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Indicators */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Progreso de Participación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between text-sm mb-2'>
                  <span>Eventos Asistidos</span>
                  <span>{stats.total_events_attended}</span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${Math.min((stats.total_events_attended / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className='flex justify-between text-sm mb-2'>
                  <span>Grupos Activos</span>
                  <span>{stats.total_groups}</span>
                </div>
                <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${Math.min((stats.total_groups / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Total de Participaciones</span>
                <Badge variant='secondary'>
                  {stats.total_groups + stats.total_events_registered}
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Tasa de Asistencia</span>
                <Badge variant='secondary'>
                  {stats.total_events_registered > 0
                    ? `${Math.round((stats.total_events_attended / stats.total_events_registered) * 100)}%`
                    : '0%'}
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Estado General</span>
                <Badge className={getActivityBadgeColor(stats.activity_score)}>
                  {activityLevel.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
