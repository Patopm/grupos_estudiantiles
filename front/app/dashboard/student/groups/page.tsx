'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GroupList from '@/components/groups/GroupList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type Group, groupsApi } from '@/lib/api/groups';

export default function StudentGroupsPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentGroupsContent />
    </ProtectedRoute>
  );
}

function StudentGroupsContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [activeGroups, setActiveGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-groups');

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        myGroupsData,
        pendingGroupsData,
        activeGroupsData,
        availableGroupsData,
      ] = await Promise.all([
        groupsApi.getMyGroups(),
        groupsApi.getFilteredGroups({ my_groups: true, pending_only: true }),
        groupsApi.getFilteredGroups({ my_groups: true, active_only: true }),
        groupsApi.getAvailable(),
      ]);

      setMyGroups(myGroupsData);
      setPendingGroups(pendingGroupsData);
      setActiveGroups(activeGroupsData);
      setAvailableGroups(availableGroupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los grupos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleJoinGroup = async (groupId: string) => {
    try {
      await groupsApi.join(groupId);
      toast({
        title: 'Solicitud Enviada',
        description:
          'Tu solicitud de ingreso ha sido enviada al presidente del grupo',
      });
      // Reload groups to update status
      loadGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud de ingreso',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) {
      return;
    }

    try {
      await groupsApi.leave(groupId);
      toast({
        title: 'Salida Exitosa',
        description: 'Has salido del grupo exitosamente',
      });
      // Reload groups to update status
      loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'No se pudo salir del grupo',
        variant: 'destructive',
      });
    }
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/dashboard/student/groups/${groupId}`);
  };

  return (
    <div className='min-h-screen bg-background'>
      <DashboardHeader
        title='Mis Grupos Estudiantiles'
        description='Gestiona tus grupos y descubre nuevas oportunidades de participación'
        showBackButton
        backUrl='/dashboard/student'
        breadcrumbs={[{ label: 'Grupos', href: '/dashboard/student/groups' }]}
      />

      <div className='max-w-7xl mx-auto p-6'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='my-groups'>
              Todos ({myGroups.length || 0})
            </TabsTrigger>
            <TabsTrigger value='active'>
              Activos ({activeGroups.length || 0})
            </TabsTrigger>
            <TabsTrigger value='pending'>
              Pendientes ({pendingGroups.length || 0})
            </TabsTrigger>
            <TabsTrigger value='available'>
              Explorar ({availableGroups.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='my-groups' className='space-y-6'>
            <GroupList
              groups={myGroups}
              title='Mis Grupos Estudiantiles'
              showSearch={true}
              showFilters={true}
              showViewToggle={true}
              enablePagination={false} // Don't paginate user's own groups
              noGroupsMessage='Aún no perteneces a ningún grupo. ¡Explora los grupos disponibles!'
              onLeave={handleLeaveGroup}
              onView={handleViewGroup}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value='active' className='space-y-6'>
            <GroupList
              groups={activeGroups}
              title='Mis Grupos Activos'
              showSearch={true}
              showFilters={true}
              showViewToggle={true}
              enablePagination={false}
              noGroupsMessage='No tienes grupos activos en este momento'
              onLeave={handleLeaveGroup}
              onView={handleViewGroup}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value='pending' className='space-y-6'>
            <GroupList
              groups={pendingGroups}
              title='Solicitudes Pendientes'
              showSearch={true}
              showFilters={true}
              showViewToggle={true}
              enablePagination={false}
              noGroupsMessage='No tienes solicitudes pendientes'
              onView={handleViewGroup}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value='available' className='space-y-6'>
            <GroupList
              groups={availableGroups}
              title='Grupos Disponibles'
              showSearch={true}
              showFilters={true}
              showViewToggle={true}
              enablePagination={true}
              itemsPerPage={12}
              noGroupsMessage='No hay grupos disponibles en este momento'
              onJoin={handleJoinGroup}
              onView={handleViewGroup}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
