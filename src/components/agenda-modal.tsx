'use client';

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Calendar, CheckCircle2, Timer, Ban } from 'lucide-react';
import type { Room, Booking, Doctor, BookingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useSessionUser } from '@/hooks/use-session-user';
import { useToast } from '@/hooks/use-toast';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  bookings: Booking[];
  doctors: Doctor[];
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void> | void;
}

export function AgendaModal({ isOpen, onClose, room, bookings, doctors, onUpdateStatus }: AgendaModalProps) {
  const { user } = useSessionUser();
  const { toast } = useToast();
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null);
  const now = new Date();
  const sortedBookings = [...bookings]
    .filter(b => !['cancelled', 'done'].includes(b.status) && b.endAt > now)
    .sort((a, b) => a.startMin - b.startMin);

  const sessionDoctor = useMemo(() => {
    if (!user || user.role !== 'DOCTOR') return null;
    return doctors.find(d => d.userId === user.id) || null;
  }, [doctors, user]);

  const canCancelBooking = (booking: Booking) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return !!sessionDoctor && booking.doctorId === sessionDoctor.id;
  };

  const handleCancel = async (booking: Booking) => {
    setIsCancellingId(booking.id);
    try {
      await onUpdateStatus(booking.id, 'cancelled');
      toast({
        title: 'Reserva cancelada',
        description: 'La reserva fue cancelada correctamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo cancelar',
        description: 'Intente de nuevo.',
      });
    } finally {
      setIsCancellingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_use': return <Timer className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'reserved': 'Reservado',
      'confirmed': 'Confirmado',
      'in_use': 'En curso',
      'done': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Calendar className="text-primary" />
            Agenda: {room.name}
          </DialogTitle>
          <DialogDescription>
            Citas programadas para hoy, {format(new Date(), 'PPPP', { locale: es })}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {sortedBookings.length > 0 ? (
              sortedBookings.map((booking) => {
                const doctor = booking.doctorId ? doctors.find((d) => d.id === booking.doctorId) : undefined;
                return (
                  <div 
                    key={booking.id} 
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border bg-card transition-colors",
                      booking.status === 'in_use' && "border-primary bg-primary/5",
                      booking.status === 'cancelled' && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center min-w-[70px] py-1 bg-muted rounded text-xs font-bold uppercase tracking-tighter">
                        <span className="text-foreground">{format(booking.startAt, 'HH:mm')}</span>
                        <div className="h-px w-4 bg-muted-foreground/30 my-0.5" />
                        <span className="text-muted-foreground">{format(booking.endAt, 'HH:mm')}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={doctor?.avatarUrl} />
                            <AvatarFallback>{doctor?.name?.charAt(0) ?? '?'}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-semibold">{doctor?.name || 'Médico no asignado'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8">{doctor?.specialty}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(booking.status)}
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      {canCancelBooking(booking) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          disabled={isCancellingId === booking.id}
                          onClick={() => handleCancel(booking)}
                        >
                          {isCancellingId === booking.id ? 'Cancelando...' : 'Cancelar'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <Calendar className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground font-medium">No hay citas registradas para hoy.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
