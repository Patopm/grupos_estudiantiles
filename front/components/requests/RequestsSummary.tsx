'use client';

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RequestsSummaryProps {
  totalPending: number;
  totalGroups: number;
  recentRequests: number;
  approvedThisWeek?: number;
  rejectedThisWeek?: number;
  onViewAll?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  type?: 'president' | 'student';
}

export default function RequestsSummary({
  totalPending,
  totalGroups,
  recentRequests,
  approvedThisWeek = 0,
  rejectedThisWeek = 0,
  onViewAll,
  onRefresh,
  isLoading = false,
  type = 'president',
}: RequestsSummaryProps) {
  const isPresident = type === 'president';

  const getSummaryCards = () => {
    if (isPresident) {
      return [
        {
          title: 'Total Pendientes',
          value: totalPending,
          icon: AlertCircle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        },
        {
          title: 'Grupos con Solicitudes',
          value: totalGroups,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
          title: 'Solicitudes Recientes',
          value: recentRequests,
          icon: Clock,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
      ];
    } else {
      return [
        {
          title: 'Total Membresías',
          value: totalPending + approvedThisWeek + rejectedThisWeek,
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        {
          title: 'Pendientes',
          value: totalPending,
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        },
        {
          title: 'Activas',
          value: approvedThisWeek,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        },
        {
          title: 'Inactivas',
          value: rejectedThisWeek,
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        },
      ];
    }
  };

  const summaryCards = getSummaryCards();

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div
        className={`grid grid-cols-1 ${isPresident ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}
      >
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className={card.bgColor}>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold ${card.color}`}>
                      {card.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Weekly Stats for Presidents */}
      {isPresident && (approvedThisWeek > 0 || rejectedThisWeek > 0) && (
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold'>
                Estadísticas de la Semana
              </h3>
              <Badge variant='outline'>Últimos 7 días</Badge>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                <div className='w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-green-600'>
                    Aprobadas
                  </p>
                  <p className='text-2xl font-bold text-green-600'>
                    {approvedThisWeek}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                <div className='w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center'>
                  <TrendingDown className='w-5 h-5 text-red-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-red-600'>Rechazadas</p>
                  <p className='text-2xl font-bold text-red-600'>
                    {rejectedThisWeek}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className='flex justify-end gap-3'>
        {onRefresh && (
          <Button variant='outline' onClick={onRefresh} disabled={isLoading}>
            <Clock
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        )}
        {onViewAll && totalPending > 0 && (
          <Button onClick={onViewAll}>
            <UserPlus className='h-4 w-4 mr-2' />
            {isPresident
              ? 'Ver Todas las Solicitudes'
              : 'Ver Todas las Membresías'}
          </Button>
        )}
      </div>
    </div>
  );
}
