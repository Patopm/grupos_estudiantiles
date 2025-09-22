'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { groupsApi, GroupDetailData, GroupError } from '@/lib/api/groups';
import GroupDetailPage from '@/components/groups/GroupDetailPage';

export default function StudentGroupDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentGroupDetailContent />
    </ProtectedRoute>
  );
}

function StudentGroupDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [groupData, setGroupData] = useState<GroupDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupId = params.id as string;

  const loadGroupData = async () => {
    if (!groupId) {
      setError('ID de grupo inválido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await groupsApi.getDetailedById(groupId);
      setGroupData(data);
    } catch (error) {
      console.error('Error loading group details:', error);
      const groupError = error as GroupError;

      if (groupError.type === 'NOT_FOUND') {
        setError('El grupo no fue encontrado');
      } else if (groupError.type === 'PERMISSION_DENIED') {
        setError('No tienes permisos para ver este grupo');
      } else if (groupError.type === 'NETWORK_ERROR') {
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        setError(
          groupError.message || 'Error al cargar los detalles del grupo'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoinGroup = async () => {
    if (!groupData) return;

    try {
      await groupsApi.joinWithErrorHandling(groupData.group_id);
      toast({
        title: 'Solicitud Enviada',
        description:
          'Tu solicitud de ingreso ha sido enviada al presidente del grupo',
      });
      // Reload group data to update status
      await loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
      const groupError = error as GroupError;

      let errorMessage = 'No se pudo enviar la solicitud de ingreso';
      if (groupError.type === 'GROUP_FULL') {
        errorMessage = 'El grupo ha alcanzado su capacidad máxima';
      } else if (groupError.type === 'ALREADY_MEMBER') {
        errorMessage = 'Ya eres miembro de este grupo';
      } else if (groupError.type === 'PENDING_REQUEST') {
        errorMessage = 'Ya tienes una solicitud pendiente para este grupo';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupData) return;

    try {
      await groupsApi.leaveWithErrorHandling(groupData.group_id);
      toast({
        title: 'Salida Exitosa',
        description: 'Has salido del grupo exitosamente',
      });
      // Reload group data to update status
      await loadGroupData();
    } catch (error) {
      console.error('Error leaving group:', error);
      const groupError = error as GroupError;

      toast({
        title: 'Error',
        description: groupError.message || 'No se pudo salir del grupo',
        variant: 'destructive',
      });
    }
  };

  const handleBackToGroups = () => {
    router.push('/dashboard/student/groups');
  };

  const handleRetry = () => {
    loadGroupData();
  };

  return (
    <GroupDetailPage
      groupData={groupData}
      isLoading={isLoading}
      error={error}
      onJoin={handleJoinGroup}
      onLeave={handleLeaveGroup}
      onBack={handleBackToGroups}
      onRetry={handleRetry}
    />
  );
}
