'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingRequestsSummaryProps {
  groupId?: string;
}

interface GroupRequest {
  request_id: number;
  user_name: string;
  user_email: string;
  group_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface EventRequest {
  request_id: number;
  user_name: string;
  user_email: string;
  event_title: string;
  event_id: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PendingRequestsData {
  groupRequests: GroupRequest[];
  eventRequests: EventRequest[];
  totalPending: number;
  recentRequests: Array<GroupRequest | EventRequest>;
}

export default function PendingRequestsSummary({
  groupId,
}: PendingRequestsSummaryProps) {
  const router = useRouter();
  const [requestsData, setRequestsData] = useState<PendingRequestsData>({
    groupRequests: [],
    eventRequests: [],
    totalPending: 0,
    recentRequests: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRequestsData = async () => {
      try {
        setIsLoading(true);

        // Mock data - in real implementation, this would come from API
        const mockData: PendingRequestsData = {
          groupRequests: [
            {
              request_id: 1,
              user_name: 'Ana García',
              user_email: 'ana.garcia@email.com',
              group_name: 'Club de Programación',
              requested_at: '2024-01-15T10:30:00Z',
              status: 'pending',
            },
            {
              request_id: 2,
              user_name: 'Carlos López',
              user_email: 'carlos.lopez@email.com',
              group_name: 'Club de Programación',
              requested_at: '2024-01-14T15:45:00Z',
              status: 'pending',
            },
            {
              request_id: 3,
              user_name: 'María Rodríguez',
              user_email: 'maria.rodriguez@email.com',
              group_name: 'Club de Robótica',
              requested_at: '2024-01-13T09:20:00Z',
              status: 'pending',
            },
          ],
          eventRequests: [
            {
              request_id: 4,
              user_name: 'Luis Fernández',
              user_email: 'luis.fernandez@email.com',
              event_title: 'Taller de React',
              event_id: 'event-1',
              requested_at: '2024-01-15T14:00:00Z',
              status: 'pending',
            },
            {
              request_id: 5,
              user_name: 'Sofia Martínez',
              user_email: 'sofia.martinez@email.com',
              event_title: 'Conferencia de IA',
              event_id: 'event-2',
              requested_at: '2024-01-14T11:30:00Z',
              status: 'pending',
            },
          ],
          totalPending: 5,
          recentRequests: [],
        };

        // Combine and sort recent requests
        const allRequests = [
          ...mockData.groupRequests,
          ...mockData.eventRequests,
        ];
        mockData.recentRequests = allRequests
          .sort(
            (a, b) =>
              new Date(b.requested_at).getTime() -
              new Date(a.requested_at).getTime()
          )
          .slice(0, 5);

        setRequestsData(mockData);
      } catch (error) {
        console.error('Error loading requests data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRequestsData();
  }, [groupId]);

  const handleApproveRequest = async (
    requestId: number,
    type: 'group' | 'event'
  ) => {
    try {
      // API call to approve request
      console.log(`Approving ${type} request:`, requestId);
      // In real implementation, call the appropriate API endpoint
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (
    requestId: number,
    type: 'group' | 'event'
  ) => {
    try {
      // API call to reject request
      console.log(`Rejecting ${type} request:`, requestId);
      // In real implementation, call the appropriate API endpoint
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='animate-pulse'>
                  <div className='h-4 bg-muted rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-muted rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Pendientes
                </p>
                <p className='text-2xl font-bold text-orange-600'>
                  {requestsData.totalPending}
                </p>
              </div>
              <AlertCircle className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Solicitudes de Grupos
                </p>
                <p className='text-2xl font-bold text-blue-600'>
                  {requestsData.groupRequests.length}
                </p>
              </div>
              <Users className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Solicitudes de Eventos
                </p>
                <p className='text-2xl font-bold text-purple-600'>
                  {requestsData.eventRequests.length}
                </p>
              </div>
              <Calendar className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Clock className='h-5 w-5' />
              Solicitudes Recientes
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push('/dashboard/president/requests')}
            >
              <Eye className='h-4 w-4 mr-2' />
              Ver Todas
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requestsData.recentRequests.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <UserPlus className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {requestsData.recentRequests.map(request => {
                const isGroupRequest = 'group_name' in request;
                return (
                  <div
                    key={request.request_id}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                        {isGroupRequest ? (
                          <Users className='w-5 h-5 text-primary' />
                        ) : (
                          <Calendar className='w-5 h-5 text-primary' />
                        )}
                      </div>
                      <div>
                        <p className='font-medium'>{request.user_name}</p>
                        <p className='text-sm text-muted-foreground'>
                          {request.user_email}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {isGroupRequest
                            ? `Grupo: ${request.group_name}`
                            : `Evento: ${request.event_title}`}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <Badge variant='outline' className='text-xs'>
                        <Clock className='w-3 h-3 mr-1' />
                        {new Date(request.requested_at).toLocaleDateString()}
                      </Badge>

                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleApproveRequest(
                              request.request_id,
                              isGroupRequest ? 'group' : 'event'
                            )
                          }
                        >
                          <CheckCircle className='w-4 h-4 mr-1' />
                          Aprobar
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleRejectRequest(
                              request.request_id,
                              isGroupRequest ? 'group' : 'event'
                            )
                          }
                        >
                          <XCircle className='w-4 h-4 mr-1' />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Gestión de Grupos
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() => router.push('/dashboard/president/groups')}
            >
              <Users className='h-4 w-4 mr-2' />
              Ver Todos los Grupos
            </Button>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() =>
                router.push('/dashboard/president/requests?type=groups')
              }
            >
              <UserPlus className='h-4 w-4 mr-2' />
              Gestionar Solicitudes de Grupos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Gestión de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() => router.push('/dashboard/president/events')}
            >
              <Calendar className='h-4 w-4 mr-2' />
              Ver Todos los Eventos
            </Button>
            <Button
              className='w-full justify-start'
              variant='outline'
              onClick={() =>
                router.push('/dashboard/president/requests?type=events')
              }
            >
              <UserPlus className='h-4 w-4 mr-2' />
              Gestionar Solicitudes de Eventos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
