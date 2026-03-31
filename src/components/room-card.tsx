'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './status-badge';
import { getRoomStatus } from '@/lib/utils';
import type { Room, Booking, Doctor, BookingStatus } from '@/lib/types';
import { Building, Clock, Calendar, LogIn, LogOut, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomCardProps {
  room: Room;
  bookings: Booking[];
  doctors: Doctor[];
  currentTime: Date | null;
  onBook: () => void;
  onViewAgenda: () => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void> | void;
}

export const RoomCard = ({
  room,
  bookings,
  doctors,
  currentTime,
  onBook,
  onViewAgenda,
  onUpdateStatus,
}: RoomCardProps) => {
  const { toast } = useToast();

  // Stable fallback date during SSR to avoid hydration mismatches.
  const now = currentTime || new Date(2025, 0, 1, 12, 0);
  const statusInfo = getRoomStatus(room, bookings, doctors, now);
  const { status, booking, doctor, text } = statusInfo;
  const bookingStatusLabel: Record<string, string> = {
    reserved: 'Reservado',
    confirmed: 'Confirmado',
    in_use: 'En curso',
    done: 'Finalizado',
    cancelled: 'Cancelado',
  };
  const isLate =
    !!currentTime &&
    !!booking &&
    booking.status === 'confirmed' &&
    currentTime > booking.startAt;

  const canCheckIn =
    !!currentTime &&
    !!booking &&
    booking.status === 'confirmed' &&
    currentTime >= booking.startAt &&
    currentTime < booking.endAt;
  const canCheckOut = !!currentTime && !!booking && booking.status === 'in_use';

  const handleQuickStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    try {
      await onUpdateStatus(bookingId, status);
    } catch {
      toast({
        variant: 'destructive',
        title: 'No se pudo actualizar',
        description: 'Intente de nuevo.',
      });
    }
  };

  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline flex items-center gap-2 text-2xl">
              <Building className="text-primary" />
              {room.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{room.roomType}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4 text-muted-foreground">
          {doctor && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor portrait" />
                <AvatarFallback>{doctor.name?.charAt(0) ?? '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{doctor.name || 'Medico no asignado'}</p>
                <p className="text-sm">{doctor.specialty}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <p className="text-sm">{currentTime ? text : 'Actualizando estado...'}</p>
          </div>
          {booking && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <p className="text-sm">
                Estado: <span className="font-semibold text-foreground">{bookingStatusLabel[booking.status] || booking.status}</span>
                {isLate && <span className="ml-2 text-xs font-semibold text-destructive">Retrasado</span>}
              </p>
            </div>
          )}
          {!doctor && status === 'Desocupado' && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <p className="text-sm">No hay citas programadas para hoy.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="font-bold" onClick={onViewAgenda}>
          <FileText className="mr-2 h-4 w-4" /> Ver agenda
        </Button>
        {canCheckIn && booking && (
          <Button
            variant="outline"
            size="sm"
            className="font-bold"
            onClick={() => void handleQuickStatusUpdate(booking.id, 'in_use')}
          >
            <LogIn className="mr-2 h-4 w-4" /> Check-in
          </Button>
        )}
        {canCheckOut && booking && (
          <Button
            variant="outline"
            size="sm"
            className="font-bold"
            onClick={() => void handleQuickStatusUpdate(booking.id, 'done')}
          >
            <LogOut className="mr-2 h-4 w-4" /> Check-out
          </Button>
        )}
        <Button onClick={onBook} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
          <Calendar className="mr-2 h-4 w-4" /> Apartar
        </Button>
      </CardFooter>
    </Card>
  );
};
