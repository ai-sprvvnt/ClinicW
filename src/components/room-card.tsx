'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusBadge } from './status-badge';
import { getRoomStatus } from '@/lib/utils';
import type { Room, Booking, Doctor, BookingStatus } from '@/lib/types';
import { format } from 'date-fns';
import { Building, Clock, User, Calendar, LogIn, LogOut, FileText } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  bookings: Booking[];
  doctors: Doctor[];
  currentTime: Date;
  onBook: () => void;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => void;
}

export const RoomCard = ({ room, bookings, doctors, currentTime, onBook, onUpdateStatus }: RoomCardProps) => {
  const statusInfo = getRoomStatus(room, bookings, doctors, currentTime);
  const { status, booking, doctor, text } = statusInfo;

  const canCheckIn = booking && booking.status === 'confirmed' && currentTime >= booking.startAt && currentTime < booking.endAt;
  const canCheckOut = booking && booking.status === 'in_use';

  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline flex items-center gap-2 text-2xl">
            <Building className="text-primary" />
            {room.name}
          </CardTitle>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4 text-muted-foreground">
          {doctor && (
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint="doctor portrait"/>
                <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{doctor.name}</p>
                <p className="text-sm">{doctor.specialty}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" />
            <p className="text-sm">{text}</p>
          </div>
          {!doctor && status === 'Desocupado' && (
             <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <p className="text-sm">No hay citas programadas para hoy.</p>
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex gap-2 justify-end">
        <Button variant="outline" size="sm" className="font-bold" disabled>
          <FileText/> Ver agenda
        </Button>
        {canCheckIn && (
          <Button variant="outline" size="sm" className="font-bold" onClick={() => onUpdateStatus(booking.id, 'in_use')}>
            <LogIn /> Check-in
          </Button>
        )}
        {canCheckOut && (
          <Button variant="outline" size="sm" className="font-bold" onClick={() => onUpdateStatus(booking.id, 'done')}>
            <LogOut /> Check-out
          </Button>
        )}
        <Button onClick={onBook} size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
          <Calendar /> Apartar
        </Button>
      </CardFooter>
    </Card>
  );
};
