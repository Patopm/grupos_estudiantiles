'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface PlatformHealthIndicatorsProps {
  healthData: {
    systemMetrics: {
      uptime: number;
      responseTime: number;
      errorRate: number;
      throughput: number;
    };
    databaseMetrics: {
      connectionPool: number;
      queryPerformance: number;
      storageUsage: number;
      backupStatus: string;
    };
    securityMetrics: {
      failedLogins: number;
      blockedRequests: number;
      securityScore: number;
      lastSecurityScan: string;
    };
    performanceMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      networkLatency: number;
    };
    userMetrics: {
      activeUsers: number;
      concurrentSessions: number;
      averageLoadTime: number;
      userSatisfaction: number;
    };
    alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }>;
  };
}

export default function PlatformHealthIndicators({
  healthData,
}: PlatformHealthIndicatorsProps) {
  const [selectedView, setSelectedView] = useState<
    'overview' | 'performance' | 'security' | 'alerts'
  >('overview');

  const getHealthColor = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadge = (
    value: number,
    thresholds: { good: number; warning: number }
  ) => {
    if (value >= thresholds.good) return 'bg-green-100 text-green-800';
    if (value >= thresholds.warning) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className='w-4 h-4 text-red-600' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4 text-yellow-600' />;
      default:
        return <CheckCircle className='w-4 h-4 text-blue-600' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>
            Indicadores de Salud de la Plataforma
          </h2>
          <p className='text-muted-foreground'>
            Monitoreo en tiempo real del estado del sistema
          </p>
        </div>
        <div className='flex gap-2'>
          {(['overview', 'performance', 'security', 'alerts'] as const).map(
            view => (
              <Button
                key={view}
                variant={selectedView === view ? 'default' : 'outline'}
                size='sm'
                onClick={() => setSelectedView(view)}
              >
                {view === 'overview'
                  ? 'Resumen'
                  : view === 'performance'
                    ? 'Rendimiento'
                    : view === 'security'
                      ? 'Seguridad'
                      : 'Alertas'}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Overview */}
      {selectedView === 'overview' && (
        <div className='space-y-6'>
          {/* System Health Overview */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tiempo de Actividad
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(healthData.systemMetrics.uptime, { good: 99, warning: 95 })}`}
                    >
                      {healthData.systemMetrics.uptime.toFixed(1)}%
                    </p>
                    <Badge
                      className={getHealthBadge(
                        healthData.systemMetrics.uptime,
                        { good: 99, warning: 95 }
                      )}
                    >
                      {healthData.systemMetrics.uptime >= 99
                        ? 'Excelente'
                        : healthData.systemMetrics.uptime >= 95
                          ? 'Bueno'
                          : 'Crítico'}
                    </Badge>
                  </div>
                  <Server className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tiempo de Respuesta
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.systemMetrics.responseTime / 10, { good: 90, warning: 70 })}`}
                    >
                      {healthData.systemMetrics.responseTime.toFixed(0)}ms
                    </p>
                    <p className='text-xs text-muted-foreground'>promedio</p>
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
                      Tasa de Error
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.systemMetrics.errorRate, { good: 99, warning: 95 })}`}
                    >
                      {healthData.systemMetrics.errorRate.toFixed(2)}%
                    </p>
                    <Badge
                      className={getHealthBadge(
                        100 - healthData.systemMetrics.errorRate,
                        { good: 99, warning: 95 }
                      )}
                    >
                      {healthData.systemMetrics.errorRate < 1
                        ? 'Excelente'
                        : healthData.systemMetrics.errorRate < 5
                          ? 'Bueno'
                          : 'Crítico'}
                    </Badge>
                  </div>
                  <AlertTriangle className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Rendimiento
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(healthData.systemMetrics.throughput, { good: 80, warning: 60 })}`}
                    >
                      {healthData.systemMetrics.throughput.toFixed(0)}
                    </p>
                    <p className='text-xs text-muted-foreground'>req/min</p>
                  </div>
                  <TrendingUp className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Database Health */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='w-5 h-5' />
                Estado de la Base de Datos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Pool de Conexiones
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.databaseMetrics.connectionPool}%
                  </p>
                  <Progress
                    value={healthData.databaseMetrics.connectionPool}
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Rendimiento de Consultas
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.databaseMetrics.queryPerformance}ms
                  </p>
                  <Progress
                    value={
                      100 - healthData.databaseMetrics.queryPerformance / 10
                    }
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Uso de Almacenamiento
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.databaseMetrics.storageUsage}%
                  </p>
                  <Progress
                    value={healthData.databaseMetrics.storageUsage}
                    className='h-2'
                  />
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Estado de Respaldo
                  </p>
                  <Badge
                    className={
                      healthData.databaseMetrics.backupStatus === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {healthData.databaseMetrics.backupStatus === 'success'
                      ? 'Actualizado'
                      : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance */}
      {selectedView === 'performance' && (
        <div className='space-y-6'>
          {/* Performance Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Uso de CPU
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.performanceMetrics.cpuUsage, { good: 80, warning: 60 })}`}
                    >
                      {healthData.performanceMetrics.cpuUsage.toFixed(1)}%
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={healthData.performanceMetrics.cpuUsage}
                        className='h-2'
                      />
                    </div>
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
                      Uso de Memoria
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.performanceMetrics.memoryUsage, { good: 80, warning: 60 })}`}
                    >
                      {healthData.performanceMetrics.memoryUsage.toFixed(1)}%
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={healthData.performanceMetrics.memoryUsage}
                        className='h-2'
                      />
                    </div>
                  </div>
                  <Database className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Uso de Disco
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.performanceMetrics.diskUsage, { good: 80, warning: 60 })}`}
                    >
                      {healthData.performanceMetrics.diskUsage.toFixed(1)}%
                    </p>
                    <div className='mt-2'>
                      <Progress
                        value={healthData.performanceMetrics.diskUsage}
                        className='h-2'
                      />
                    </div>
                  </div>
                  <Server className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Latencia de Red
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(100 - healthData.performanceMetrics.networkLatency / 10, { good: 90, warning: 70 })}`}
                    >
                      {healthData.performanceMetrics.networkLatency.toFixed(0)}
                      ms
                    </p>
                    <p className='text-xs text-muted-foreground'>promedio</p>
                  </div>
                  <Zap className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Performance */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Rendimiento de Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Usuarios Activos
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.userMetrics.activeUsers}
                  </p>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Sesiones Concurrentes
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.userMetrics.concurrentSessions}
                  </p>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Tiempo de Carga
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.userMetrics.averageLoadTime.toFixed(0)}ms
                  </p>
                </div>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Satisfacción
                  </p>
                  <p className='text-lg font-bold'>
                    {healthData.userMetrics.userSatisfaction.toFixed(1)}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security */}
      {selectedView === 'security' && (
        <div className='space-y-6'>
          {/* Security Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Puntuación de Seguridad
                    </p>
                    <p
                      className={`text-2xl font-bold ${getHealthColor(healthData.securityMetrics.securityScore, { good: 90, warning: 70 })}`}
                    >
                      {healthData.securityMetrics.securityScore.toFixed(0)}/100
                    </p>
                    <Badge
                      className={getHealthBadge(
                        healthData.securityMetrics.securityScore,
                        { good: 90, warning: 70 }
                      )}
                    >
                      {healthData.securityMetrics.securityScore >= 90
                        ? 'Excelente'
                        : healthData.securityMetrics.securityScore >= 70
                          ? 'Bueno'
                          : 'Necesita Mejora'}
                    </Badge>
                  </div>
                  <Shield className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Logins Fallidos
                    </p>
                    <p className='text-2xl font-bold'>
                      {healthData.securityMetrics.failedLogins}
                    </p>
                    <p className='text-xs text-muted-foreground'>últimas 24h</p>
                  </div>
                  <AlertTriangle className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Solicitudes Bloqueadas
                    </p>
                    <p className='text-2xl font-bold'>
                      {healthData.securityMetrics.blockedRequests}
                    </p>
                    <p className='text-xs text-muted-foreground'>últimas 24h</p>
                  </div>
                  <Shield className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Último Escaneo
                    </p>
                    <p className='text-lg font-bold'>
                      {new Date(
                        healthData.securityMetrics.lastSecurityScan
                      ).toLocaleDateString()}
                    </p>
                    <p className='text-xs text-muted-foreground'>seguridad</p>
                  </div>
                  <CheckCircle className='h-8 w-8 text-muted-foreground' />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alerts */}
      {selectedView === 'alerts' && (
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertTriangle className='w-5 h-5' />
                Alertas del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {healthData.alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      alert.resolved
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      {getAlertIcon(alert.type)}
                      <div>
                        <p className='font-medium'>{alert.message}</p>
                        <p className='text-sm text-muted-foreground'>
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                      {alert.resolved ? 'Resuelto' : 'Activo'}
                    </Badge>
                  </div>
                ))}
                {healthData.alerts.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    <CheckCircle className='w-12 h-12 mx-auto mb-4 text-green-600' />
                    <p>No hay alertas activas</p>
                    <p className='text-sm'>
                      El sistema está funcionando correctamente
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
