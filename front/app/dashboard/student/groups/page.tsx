'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, Group } from '@/lib/api/groups';
import GroupList from '@/components/groups/GroupList';

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
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-groups');

  const loadGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      const [myGroupsData, availableGroupsData] = await Promise.all([
        groupsApi.getMyGroups(),
        groupsApi.getAvailable(),
      ]);

      setMyGroups(myGroupsData);
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
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='my-groups'>
              Mis Grupos ({myGroups.length || 0})
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
              emptyMessage='Aún no perteneces a ningún grupo. ¡Explora los grupos disponibles!'
              onLeave={handleLeaveGroup}
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
              emptyMessage='No hay grupos disponibles en este momento'
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
