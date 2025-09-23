'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle,
  Activity,
  Award,
  UserPlus,
  UserMinus,
} from 'lucide-react';

interface UserEngagementReportsProps {
  engagementData: {
    userMetrics: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      newUsersThisMonth: number;
      userGrowthRate: number;
      averageSessionDuration: number;
      userRetentionRate: number;
    };
    activityMetrics: {
      totalLogins: number;
      averageLoginsPerUser: number;
      mostActiveUsers: Array<{
        user_id: number;
        full_name: string;
        email: string;
        role: string;
        login_count: number;
        last_login: string;
        groups_joined: number;
        events_attended: number;
      }>;
      loginTrend: Array<{
        date: string;
        logins: number;
        unique_users: number;
      }>;
      userActivityDistribution: Array<{
        activity_level: string;
        count: number;
        percentage: number;
      }>;
    };
    participationMetrics: {
      totalMemberships: number;
      averageMembershipsPerUser: number;
      mostEngagedUsers: Array<{
        user_id: number;
        full_name: string;
        email: string;
        groups_joined: number;
        events_attended: number;
        events_created: number;
        engagement_score: number;
      }>;
      participationTrend: Array<{
        month: string;
        new_memberships: number;
        events_attended: number;
      }>;
    };
    roleMetrics: {
      students: {
        total: number;
        active: number;
        averageGroups: number;
        averageEvents: number;
      };
      presidents: {
        total: number;
        active: number;
        averageGroupsManaged: number;
        averageEventsCreated: number;
      };
      admins: {
        total: number;
        lastActive: string;
      };
    };
  };
}

export default function UserEngagementReports({
  engagementData,
}: UserEngagementReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    'week' | 'month' | 'quarter'
  >('month');
  const [selectedView, setSelectedView] = useState<
    'overview' | 'activity' | 'participation' | 'roles'
  >('overview');

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getActivityLevel = (count: number) => {
    if (count >= 20) return 'Muy Activo';
    if (count >= 10) return 'Activo';
    if (count >= 5) return 'Moderado';
    return 'Bajo';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>
            Reportes de Participación de Usuarios
          </h2>
          <p className='text-muted-foreground'>
            Análisis detallado de la participación y engagement de usuarios
          </p>
        </div>
        <div className='flex gap-2'>
          {(['week', 'month', 'quarter'] as const).map(period => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedPeriod(period)}
            >
              {period === 'week'
                ? 'Semana'
                : period === 'month'
                  ? 'Mes'
                  : 'Trimestre'}
            </Button>
          ))}
        </div>
      </div>

      {/* View Selector */}
      <div className='flex gap-2'>
        {(['overview', 'activity', 'participation', 'roles'] as const).map(
          view => (
            <Button
              key={view}
              variant={selectedView === view ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedView(view)}
            >
              {view === 'overview'
                ? 'Resumen'
                : view === 'activity'
                  ? 'Actividad'
                  : view === 'participation'
                    ? 'Participación'
                    : 'Roles'}
            </Button>
          )
        )}
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className='space-y-6'>
          {/* User Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Total Usuarios
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.totalUsers}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {engagementData.userMetrics.activeUsers} activos
                    </p>
                  </div>
                  <Users className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Nuevos Usuarios
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.newUsersThisMonth}
                    </p>
                    <p className='text-xs text-muted-foreground'>este mes</p>
                  </div>
                  <UserPlus className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tasa de Crecimiento
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.userGrowthRate.toFixed(1)}%
                    </p>
                    <div className='flex items-center gap-1 mt-1'>
                      {engagementData.userMetrics.userGrowthRate > 0 ? (
                        <TrendingUp className='w-3 h-3 text-green-600' />
                      ) : (
                        <TrendingDown className='w-3 h-3 text-red-600' />
                      )}
                      <span className='text-xs text-muted-foreground'>
                        vs mes anterior
                      </span>
                    </div>
                  </div>
                  <TrendingUp className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Retención
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.userRetentionRate.toFixed(1)}%
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={engagementData.userMetrics.userRetentionRate}
                        className='h-2'
                      />
                    </div>
                  </div>
                  <CheckCircle className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='w-5 h-5' />
                Distribución de Actividad de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {engagementData.activityMetrics.userActivityDistribution.map(
                  (item, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm font-medium'>
                          {getActivityLevel(parseInt(item.activity_level))}
                        </span>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-muted-foreground'>
                            {item.count} usuarios
                          </span>
                          <Badge variant='outline'>
                            {item.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={item.percentage} className='h-2' />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity */}
      {selectedView === 'activity' && (
        <div className='space-y-6'>
          {/* Activity Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Total Logins
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.activityMetrics.totalLogins}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {engagementData.activityMetrics.averageLoginsPerUser.toFixed(
                        1
                      )}{' '}
                      por usuario
                    </p>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Duración Promedio
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.averageSessionDuration.toFixed(
                        0
                      )}
                      min
                    </p>
                    <p className='text-xs text-muted-foreground'>por sesión</p>
                  </div>
                  <Clock className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Usuarios Inactivos
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.userMetrics.inactiveUsers}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Requieren atención
                    </p>
                  </div>
                  <UserMinus className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Usuarios Más Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {engagementData.activityMetrics.mostActiveUsers.map(
                  (user, index) => (
                    <div
                      key={user.user_id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                          <span className='text-sm font-bold text-primary'>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium'>{user.full_name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {user.email} • {user.role}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.login_count}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            logins
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.groups_joined}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            grupos
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.events_attended}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            eventos
                          </p>
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Último:{' '}
                          {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participation */}
      {selectedView === 'participation' && (
        <div className='space-y-6'>
          {/* Participation Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Total Membresías
                    </p>
                    <p className='text-2xl font-bold'>
                      {engagementData.participationMetrics.totalMemberships}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {engagementData.participationMetrics.averageMembershipsPerUser.toFixed(
                        1
                      )}{' '}
                      por usuario
                    </p>
                  </div>
                  <Users className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Usuarios Comprometidos
                    </p>
                    <p className='text-2xl font-bold'>
                      {
                        engagementData.participationMetrics.mostEngagedUsers
                          .length
                      }
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      alta participación
                    </p>
                  </div>
                  <CheckCircle className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Promedio Eventos
                    </p>
                    <p className='text-2xl font-bold'>
                      {(
                        engagementData.participationMetrics.mostEngagedUsers.reduce(
                          (sum, user) => sum + user.events_attended,
                          0
                        ) /
                        engagementData.participationMetrics.mostEngagedUsers
                          .length
                      ).toFixed(1)}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      por usuario activo
                    </p>
                  </div>
                  <Activity className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Most Engaged Users */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Award className='w-5 h-5' />
                Usuarios Más Comprometidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {engagementData.participationMetrics.mostEngagedUsers.map(
                  (user, index) => (
                    <div
                      key={user.user_id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                          <span className='text-sm font-bold text-primary'>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className='font-medium'>{user.full_name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.groups_joined}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            grupos
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.events_attended}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            asistidos
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium'>
                            {user.events_created}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            creados
                          </p>
                        </div>
                        <Badge
                          className={getEngagementBadge(user.engagement_score)}
                        >
                          {user.engagement_score.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Roles */}
      {selectedView === 'roles' && (
        <div className='space-y-6'>
          {/* Role Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  Estudiantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Total</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.students.total}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Activos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.students.active}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Promedio Grupos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.students.averageGroups.toFixed(
                        1
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Promedio Eventos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.students.averageEvents.toFixed(
                        1
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CheckCircle className='w-5 h-5' />
                  Presidentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Total</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.presidents.total}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Activos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.presidents.active}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Promedio Grupos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.presidents.averageGroupsManaged.toFixed(
                        1
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Promedio Eventos</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.presidents.averageEventsCreated.toFixed(
                        1
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='w-5 h-5' />
                  Administradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Total</span>
                    <span className='font-bold'>
                      {engagementData.roleMetrics.admins.total}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm'>Última Actividad</span>
                    <span className='font-bold text-xs'>
                      {new Date(
                        engagementData.roleMetrics.admins.lastActive
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
