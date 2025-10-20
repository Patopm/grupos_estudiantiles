"use client";

import { Calendar, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EnhancedParticipationStats from "@/components/dashboard/EnhancedParticipationStats";
import EventRecommendations from "@/components/dashboard/EventRecommendations";
import { StudentQuickActions } from "@/components/dashboard/QuickActions";
import UpcomingEventsSection from "@/components/dashboard/UpcomingEventsSection";
import GroupList from "@/components/groups/GroupList";
import { ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { dashboardApi, type StudentDashboardData } from "@/lib/api/dashboard";
import { groupsApi } from "@/lib/api/groups";

export default function StudentDashboard() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent />
    </ProtectedRoute>
  );
}

function StudentDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] =
    useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await dashboardApi.getStudentData();
        setDashboardData(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshDashboardData = async () => {
    try {
      const data = await dashboardApi.getStudentData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm("¿Estás seguro de que quieres salir de este grupo?")) {
      return;
    }

    try {
      await groupsApi.leave(groupId);
      toast({
        title: "Salida Exitosa",
        description: "Has salido del grupo exitosamente",
      });
      refreshDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "No se pudo salir del grupo",
        variant: "destructive",
      });
    }
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/dashboard/student/groups/${groupId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          title="Dashboard Estudiante"
          description="Cargando..."
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={`¡Hola, ${user?.first_name}!`}
        description="Bienvenido a tu dashboard de estudiante. Aquí podrás gestionar tus grupos y eventos."
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* New Student Welcome Card - Show when student has no groups */}
        {dashboardData &&
          dashboardData.participation_stats.total_groups === 0 && (
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 rounded-lg p-8 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    ¡Bienvenido a la plataforma!
                  </h2>
                  <p className="text-muted-foreground">
                    Para comenzar tu experiencia estudiantil, únete a grupos que
                    te interesen. Aquí podrás participar en eventos, conocer
                    compañeros y desarrollar nuevas habilidades.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/dashboard/student/groups?tab=available")
                    }
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Ver Grupos Disponibles
                  </button>
                  <div className="text-sm text-muted-foreground">
                    Descubre grupos estudiantiles que coincidan con tus
                    intereses
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Enhanced Statistics - Show when student has groups */}
        {dashboardData &&
          dashboardData.participation_stats.total_groups > 0 && (
            <EnhancedParticipationStats
              stats={dashboardData.participation_stats}
            />
          )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Stats Overview */}
          {dashboardData &&
            dashboardData.participation_stats.total_groups > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grupos</p>
                      <p className="text-xl font-bold">
                        {dashboardData.participation_stats.total_groups}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Calendar className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Eventos</p>
                      <p className="text-xl font-bold">
                        {
                          dashboardData.participation_stats
                            .total_events_attended
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-4 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Próximos</p>
                      <p className="text-xl font-bold">
                        {dashboardData.upcoming_events.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Search className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Actividad</p>
                      <p className="text-xl font-bold">
                        {dashboardData.participation_stats.activity_score}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Main Content Grid - 2x2 Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <div className="space-y-4">
              {dashboardData && (
                <UpcomingEventsSection
                  events={dashboardData.upcoming_events}
                  onRefresh={refreshDashboardData}
                />
              )}
            </div>

            {/* My Groups */}
            <div className="space-y-4">
              <GroupList
                groups={dashboardData?.my_groups.slice(0, 3) || []}
                label="Mis Grupos"
                showSearch={false}
                showFilters={false}
                variant="compact"
                noGroupsMessage="No perteneces a ningún grupo"
                onLeave={handleLeaveGroup}
                onView={handleViewGroup}
                viewAllAction={{
                  label: `Ver todos mis grupos (${dashboardData?.my_groups.length || 0})`,
                  onClick: () => router.push("/dashboard/student/groups"),
                  showWhen: (dashboardData?.my_groups.length || 0) > 3,
                }}
              />
            </div>

            {/* Recent Activity */}
            {dashboardData?.recent_activity && (
              <div className="space-y-4">
                <ActivityFeed activities={dashboardData.recent_activity} />
              </div>
            )}

            {/* Event Recommendations */}
            {dashboardData?.recommended_events && (
              <div className="space-y-4">
                <EventRecommendations
                  events={dashboardData.recommended_events}
                  onRefresh={refreshDashboardData}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <StudentQuickActions
          pendingRequests={
            dashboardData?.participation_stats.pending_requests_count
          }
          upcomingEvents={dashboardData?.upcoming_events.length}
        />

        {/* Footer - User Information */}
        <div className="mt-8 p-6 bg-primary/5 dark:bg-primary/10 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Información de Usuario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Matrícula:</strong> {user?.student_id}
            </div>
            <div>
              <strong>Teléfono:</strong> {user?.phone}
            </div>
            <div>
              <strong>Rol:</strong> {user?.role_display}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
