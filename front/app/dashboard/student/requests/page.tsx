"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  User,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute, useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { type GroupMember, groupsApi } from "@/lib/api/groups";

interface StudentMembership extends GroupMember {
  group_name: string;
  group_id: string;
}

export default function StudentRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentRequestsContent />
    </ProtectedRoute>
  );
}

function StudentRequestsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<StudentMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadMembershipsData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get user's groups to get membership information
      const myGroups = await groupsApi.getMyGroups();

      // Get detailed membership information for each group
      const membershipsData: StudentMembership[] = [];

      for (const group of myGroups) {
        try {
          const members = await groupsApi.getMembers(group.group_id);
          if (members && Array.isArray(members)) {
            const userMembership = members.find(
              member => member.user_details.id === user?.id
            );

            if (userMembership) {
              membershipsData.push({
                ...userMembership,
                group_name: group.name,
                group_id: group.group_id,
              });
            }
          }
        } catch (error) {
          console.error(
            `Error loading membership for group ${group.name}:`,
            error
          );
        }
      }

      setMemberships(membershipsData);
    } catch (error) {
      console.error("Error loading memberships data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las membresías",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadMembershipsData();
  }, [loadMembershipsData]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendiente",
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          icon: Clock,
          description:
            "Tu solicitud está siendo revisada por el presidente del grupo",
        };
      case "active":
        return {
          label: "Activo",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          icon: CheckCircle,
          description: "Eres miembro activo de este grupo",
        };
      case "inactive":
        return {
          label: "Inactivo",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          icon: XCircle,
          description: "Ya no eres miembro de este grupo",
        };
      default:
        return {
          label: "Desconocido",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          icon: AlertCircle,
          description: "Estado de membresía desconocido",
        };
    }
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "president":
        return {
          label: "Presidente",
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          icon: Users,
        };
      case "member":
        return {
          label: "Miembro",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          icon: User,
        };
      default:
        return {
          label: "Miembro",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          icon: User,
        };
    }
  };

  const pendingMemberships = memberships.filter(m => m.status === "pending");
  const activeMemberships = memberships.filter(m => m.status === "active");
  const inactiveMemberships = memberships.filter(m => m.status === "inactive");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          title="Mis Solicitudes de Membresía"
          description="Estado de tus solicitudes de ingreso a grupos"
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title="Mis Solicitudes de Membresía"
        description="Estado de tus solicitudes de ingreso a grupos"
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Membresías
                  </p>
                  <p className="text-2xl font-bold">{memberships.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pendientes
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {pendingMemberships.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Activas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {activeMemberships.length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Inactivas
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    {inactiveMemberships.length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={loadMembershipsData}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Main Content */}
        {memberships.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No tienes membresías
              </h3>
              <p className="text-muted-foreground mb-6">
                Aún no has solicitado unirte a ningún grupo estudiantil.
              </p>
              <Button
                onClick={() =>
                  (window.location.href = "/dashboard/student/groups")
                }
              >
                <Users className="h-4 w-4 mr-2" />
                Explorar Grupos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todas ({memberships.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({pendingMemberships.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Activas ({activeMemberships.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactivas ({inactiveMemberships.length})
              </TabsTrigger>
            </TabsList>

            {/* All Memberships Tab */}
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Todas mis Membresías
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {memberships
                      .sort(
                        (a, b) =>
                          new Date(b.joined_at).getTime() -
                          new Date(a.joined_at).getTime()
                      )
                      .map(membership => {
                        const statusInfo = getStatusInfo(membership.status);
                        const roleInfo = getRoleInfo(membership.role);
                        const StatusIcon = statusInfo.icon;
                        const RoleIcon = roleInfo.icon;

                        return (
                          <div
                            key={`${membership.group_id}-${membership.user_details.id}`}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {membership.group_name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      membership.joined_at
                                    ).toLocaleDateString("es-ES")}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {statusInfo.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={`text-xs ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleInfo.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Memberships Tab */}
            <TabsContent value="pending" className="space-y-4">
              {pendingMemberships.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No hay solicitudes pendientes
                    </h3>
                    <p className="text-muted-foreground">
                      Todas tus solicitudes han sido procesadas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Solicitudes Pendientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingMemberships.map(membership => {
                        const statusInfo = getStatusInfo(membership.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                          <div
                            key={`${membership.group_id}-${membership.user_details.id}`}
                            className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                <StatusIcon className="w-6 h-6 text-yellow-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {membership.group_name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      membership.joined_at
                                    ).toLocaleDateString("es-ES")}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {statusInfo.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={`text-xs ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Active Memberships Tab */}
            <TabsContent value="active" className="space-y-4">
              {activeMemberships.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No tienes membresías activas
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Explora los grupos disponibles y solicita unirte.
                    </p>
                    <Button
                      onClick={() =>
                        (window.location.href = "/dashboard/student/groups")
                      }
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Explorar Grupos
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Membresías Activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeMemberships.map(membership => {
                        const statusInfo = getStatusInfo(membership.status);
                        const roleInfo = getRoleInfo(membership.role);
                        const StatusIcon = statusInfo.icon;
                        const RoleIcon = roleInfo.icon;

                        return (
                          <div
                            key={`${membership.group_id}-${membership.user_details.id}`}
                            className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <StatusIcon className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {membership.group_name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      membership.joined_at
                                    ).toLocaleDateString("es-ES")}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {statusInfo.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={`text-xs ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleInfo.label}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  (window.location.href = `/dashboard/student/groups/${membership.group_id}`)
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Grupo
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inactive Memberships Tab */}
            <TabsContent value="inactive" className="space-y-4">
              {inactiveMemberships.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No tienes membresías inactivas
                    </h3>
                    <p className="text-muted-foreground">
                      Todas tus membresías están activas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Membresías Inactivas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inactiveMemberships.map(membership => {
                        const statusInfo = getStatusInfo(membership.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                          <div
                            key={`${membership.group_id}-${membership.user_details.id}`}
                            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/20"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                                <StatusIcon className="w-6 h-6 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {membership.group_name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(
                                      membership.joined_at
                                    ).toLocaleDateString("es-ES")}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {statusInfo.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={`text-xs ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
