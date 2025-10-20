"use client";

import { Calendar, Check, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { EventAttendee } from "@/lib/api/events";
import { eventsApi } from "@/lib/api/events";

interface EventAttendanceRequestsProps {
  eventId: string;
  attendees: EventAttendee[];
  onRequestHandled: () => void;
}

export default function EventAttendanceRequests({
  eventId,
  attendees,
  onRequestHandled,
}: EventAttendanceRequestsProps) {
  const { toast } = useToast();
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(
    new Set()
  );

  // Filter pending requests
  const pendingRequests = attendees.filter(
    attendee => attendee.status === "pending"
  );

  const handleRequest = async (
    attendanceId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingRequests(prev => new Set(prev).add(attendanceId));

    try {
      const response = await eventsApi.handleAttendanceRequest(
        eventId,
        attendanceId,
        action
      );
      toast({
        title:
          action === "approve" ? "Solicitud Aprobada" : "Solicitud Rechazada",
        description: response.message,
      });
      onRequestHandled();
    } catch (error: unknown) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: "Error",
        description: `No se pudo ${action === "approve" ? "aprobar" : "rechazar"} la solicitud`,
        variant: "destructive",
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(attendanceId);
        return newSet;
      });
    }
  };

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Solicitudes de Asistencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay solicitudes pendientes de asistencia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Solicitudes de Asistencia
          <Badge variant="secondary">{pendingRequests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.map((request, index) => (
          <div key={request.attendance_id}>
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarFallback>
                  {request.user_details.full_name
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">
                    {request.user_details.full_name}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {request.user_details.student_id}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {request.user_details.email}
                </p>

                {request.notes && (
                  <div className="bg-muted/50 rounded-md p-3 mb-3">
                    <p className="text-sm">{request.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(request.registration_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleRequest(request.attendance_id, "approve")
                  }
                  disabled={processingRequests.has(request.attendance_id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRequest(request.attendance_id, "reject")}
                  disabled={processingRequests.has(request.attendance_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {index < pendingRequests.length - 1 && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
