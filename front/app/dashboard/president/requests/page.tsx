'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, GroupRequest } from '@/lib/api/groups';
import {
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  User,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from 'lucide-react';

interface GroupWithRequests {
  group_id: string;
  name: string;
  pending_requests: GroupRequest[];
  total_requests: number;
}

export default function PresidentRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={['president']}>
      <PresidentRequestsContent />
    </ProtectedRoute>
  );
}

function PresidentRequestsContent() {
  const { toast } = useToast();
  const [groupsWithRequests, setGroupsWithRequests] = useState<
    GroupWithRequests[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadRequestsData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRequestsData = async () => {
    try {
      setIsLoading(true);

      // Get user's groups (as president)
      const myGroups = await groupsApi.getMyGroups();

      // Get requests for each group
      const groupsWithRequestsData: GroupWithRequests[] = [];

      for (const group of myGroups) {
        try {
          const requests = await groupsApi.getRequests(group.group_id);

          if (requests && Array.isArray(requests) && requests.length > 0) {
            groupsWithRequestsData.push({
              group_id: group.group_id,
              name: group.name,
              pending_requests: requests,
              total_requests: requests.length,
            });
          }
        } catch (error) {
          console.error(
            `Error loading requests for group ${group.name}:`,
            error
          );
        }
      }

      setGroupsWithRequests(groupsWithRequestsData);
    } catch (error) {
      console.error('Error loading requests data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (groupId: string, userId: string) => {
    try {
      setProcessingRequest(`${groupId}-${userId}`);
      await groupsApi.approveRequest(groupId, userId);

      toast({
        title: 'Solicitud aprobada',
        description: 'El usuario ha sido agregado al grupo exitosamente',
      });

      // Reload data
      await loadRequestsData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aprobar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (groupId: string, userId: string) => {
    try {
      setProcessingRequest(`${groupId}-${userId}`);
      await groupsApi.rejectRequest(groupId, userId);

      toast({
        title: 'Solicitud rechazada',
        description: 'La solicitud ha sido rechazada',
      });

      // Reload data
      await loadRequestsData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const getTotalPendingRequests = () => {
    return groupsWithRequests.reduce(
      (total, group) => total + group.total_requests,
      0
    );
  };

  const getAllRequests = () => {
    return groupsWithRequests.flatMap(group =>
      group.pending_requests.map(request => ({
        ...request,
        group_name: group.name,
        group_id: group.group_id,
      }))
    );
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background'>
        <DashboardHeader
          title='Solicitudes de Membresía'
          description='Gestiona las solicitudes de ingreso a tus grupos'
        />
        <div className='max-w-7xl mx-auto p-6'>
          <div className='space-y-6'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <div className='animate-pulse'>
                    <div className='h-4 bg-muted rounded w-3/4 mb-4'></div>
                    <div className='h-8 bg-muted rounded w-1/2'></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalPending = getTotalPendingRequests();
  const allRequests = getAllRequests();

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Solicitudes de Membresía'
        description='Gestiona las solicitudes de ingreso a tus grupos'
      />

      <div className='max-w-7xl mx-auto p-6 space-y-6'>
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
                    {totalPending}
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
                    Grupos con Solicitudes
                  </p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {groupsWithRequests.length}
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
                    Solicitudes Recientes
                  </p>
                  <p className='text-2xl font-bold text-green-600'>
                    {
                      allRequests.filter(req => {
                        const requestDate = new Date(req.joined_at);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        return requestDate > oneWeekAgo;
                      }).length
                    }
                  </p>
                </div>
                <Clock className='h-8 w-8 text-green-600' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className='flex justify-end'>
          <Button
            variant='outline'
            onClick={loadRequestsData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Main Content */}
        {totalPending === 0 ? (
          <Card>
            <CardContent className='p-12 text-center'>
              <UserCheck className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>
                No hay solicitudes pendientes
              </h3>
              <p className='text-muted-foreground mb-6'>
                Todas las solicitudes de membresía han sido procesadas.
              </p>
              <Button onClick={loadRequestsData}>
                <RefreshCw className='h-4 w-4 mr-2' />
                Verificar Nuevas Solicitudes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-6'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='all'>
                Todas las Solicitudes ({totalPending})
              </TabsTrigger>
              <TabsTrigger value='by-group'>
                Por Grupo ({groupsWithRequests.length})
              </TabsTrigger>
            </TabsList>

            {/* All Requests Tab */}
            <TabsContent value='all' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <UserPlus className='h-5 w-5' />
                    Todas las Solicitudes Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {allRequests
                      .sort(
                        (a, b) =>
                          new Date(b.joined_at).getTime() -
                          new Date(a.joined_at).getTime()
                      )
                      .map(request => (
                        <div
                          key={`${request.group_id}-${request.user}`}
                          className='flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                              <User className='w-6 h-6 text-primary' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-lg mb-2'>
                                {request.user_details.full_name}
                              </h4>
                              <div className='space-y-2 text-sm text-muted-foreground'>
                                <div className='flex items-center gap-2'>
                                  <Mail className='w-4 h-4 flex-shrink-0' />
                                  <span className='break-all'>
                                    {request.user_details.email}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Users className='w-4 h-4 flex-shrink-0' />
                                  <span className='break-words'>
                                    {request.group_name}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Clock className='w-4 h-4 flex-shrink-0' />
                                  <span>
                                    {new Date(
                                      request.joined_at
                                    ).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/50'>
                            <Badge
                              variant='outline'
                              className='text-xs self-start'
                            >
                              <Clock className='w-3 h-3 mr-1' />
                              Pendiente
                            </Badge>

                            <div className='flex gap-2 w-full sm:w-auto'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleApproveRequest(
                                    request.group_id,
                                    request.user
                                  )
                                }
                                disabled={
                                  processingRequest ===
                                  `${request.group_id}-${request.user}`
                                }
                                className='flex-1 sm:flex-none text-green-500 border-green-500 hover:bg-green-500 hover:text-white'
                              >
                                <CheckCircle className='w-4 h-4 mr-1' />
                                Aprobar
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleRejectRequest(
                                    request.group_id,
                                    request.user
                                  )
                                }
                                disabled={
                                  processingRequest ===
                                  `${request.group_id}-${request.user}`
                                }
                                className='flex-1 sm:flex-none text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
                              >
                                <XCircle className='w-4 h-4 mr-1' />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* By Group Tab */}
            <TabsContent value='by-group' className='space-y-6'>
              {groupsWithRequests.map(group => (
                <Card key={group.group_id}>
                  <CardHeader>
                    <CardTitle className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Users className='h-5 w-5' />
                        {group.name}
                      </div>
                      <Badge variant='secondary'>
                        {group.total_requests} solicitud
                        {group.total_requests !== 1 ? 'es' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {group.pending_requests.map(request => (
                        <div
                          key={request.user}
                          className='flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4'
                        >
                          <div className='flex items-start gap-4'>
                            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                              <User className='w-5 h-5 text-primary' />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='font-medium text-lg mb-2'>
                                {request.user_details.full_name}
                              </h4>
                              <div className='space-y-2 text-sm text-muted-foreground'>
                                <div className='flex items-center gap-2'>
                                  <Mail className='w-4 h-4 flex-shrink-0' />
                                  <span className='break-all'>
                                    {request.user_details.email}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Clock className='w-4 h-4 flex-shrink-0' />
                                  <span>
                                    {new Date(
                                      request.joined_at
                                    ).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/50'>
                            <Badge
                              variant='outline'
                              className='text-xs self-start'
                            >
                              <Clock className='w-3 h-3 mr-1' />
                              Pendiente
                            </Badge>

                            <div className='flex gap-2 w-full sm:w-auto'>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleApproveRequest(
                                    group.group_id,
                                    request.user
                                  )
                                }
                                disabled={
                                  processingRequest ===
                                  `${group.group_id}-${request.user}`
                                }
                                className='flex-1 sm:flex-none text-green-500 border-green-500 hover:bg-green-500 hover:text-white'
                              >
                                <CheckCircle className='w-4 h-4 mr-1' />
                                Aprobar
                              </Button>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() =>
                                  handleRejectRequest(
                                    group.group_id,
                                    request.user
                                  )
                                }
                                disabled={
                                  processingRequest ===
                                  `${group.group_id}-${request.user}`
                                }
                                className='flex-1 sm:flex-none text-red-500 border-red-500 hover:bg-red-500 hover:text-white'
                              >
                                <XCircle className='w-4 h-4 mr-1' />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
