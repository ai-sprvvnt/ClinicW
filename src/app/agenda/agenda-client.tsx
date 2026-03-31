'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/header';
import { RoomCard } from '@/components/room-card';
import { BookingModal } from '@/components/booking-modal';
import { AgendaModal } from '@/components/agenda-modal';
import type { Room, Booking, Doctor } from '@/lib/types';
import { useBookingManager } from '@/hooks/use-booking-manager';
import { useDoctors } from '@/hooks/use-doctors';
import { useRooms } from '@/hooks/use-rooms';
import { useSessionUser } from '@/hooks/use-session-user';
import { Loader2 } from 'lucide-react';
import { addDays, endOfDay, isWithinInterval, startOfDay } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AgendaClient() {
  const { user, isLoading: isUserLoading } = useSessionUser();
  const { bookings, addBooking, updateBookingStatus, isLoading: isBookingsLoading } = useBookingManager();
  const { doctors, isLoading: isDocsLoading } = useDoctors();
  const { rooms, isLoading: isRoomsLoading } = useRooms();

  const [modalState, setModalState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });

  const [agendaState, setAgendaState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [viewRange, setViewRange] = useState<'today' | 'tomorrow' | 'week'>('today');

  const bookingsByRoom = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.roomId]) {
        acc[booking.roomId] = [];
      }
      acc[booking.roomId].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [bookings]);
  const range = useMemo(() => {
    const current = new Date();
    if (viewRange === 'today') {
      return { start: startOfDay(current), end: endOfDay(current) };
    }
    if (viewRange === 'tomorrow') {
      const tomorrow = addDays(current, 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };
    }
    const end = endOfDay(addDays(current, 6));
    return { start: startOfDay(current), end };
  }, [viewRange]);
  const filteredBookingsByRoom = useMemo(() => {
    return Object.fromEntries(
      Object.entries(bookingsByRoom).map(([roomId, list]) => [
        roomId,
        list.filter((b) => isWithinInterval(b.startAt, range)),
      ])
    ) as Record<string, Booking[]>;
  }, [bookingsByRoom, range]);

  if (isBookingsLoading || isDocsLoading || isUserLoading || isRoomsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
            <h2 className="text-2xl font-headline font-bold text-foreground">Acceso restringido</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para ver la agenda y gestionar las salas.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/admin">
                <Button size="sm" className="font-bold">
                  Acceso Staff
                </Button>
              </Link>
              <Link href="/">
                <Button size="sm" variant="ghost" className="font-bold">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${viewRange === 'today' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            onClick={() => setViewRange('today')}
          >
            Hoy
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${viewRange === 'tomorrow' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            onClick={() => setViewRange('tomorrow')}
          >
            Mañana
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-sm font-semibold ${viewRange === 'week' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
            onClick={() => setViewRange('week')}
          >
            Semana
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              bookings={filteredBookingsByRoom[room.id] || []}
              doctors={doctors as Doctor[]}
              onBook={() => setModalState({ open: true, room })}
              onViewAgenda={() => setAgendaState({ open: true, room })}
              onUpdateStatus={updateBookingStatus}
              currentTime={new Date()}
            />
          ))}
        </div>
      </main>

      {modalState.room && (
        <BookingModal
          isOpen={modalState.open}
          onClose={() => setModalState({ open: false, room: null })}
          room={modalState.room}
          doctors={doctors as Doctor[]}
          bookings={bookingsByRoom[modalState.room.id] || []}
          onAddBooking={addBooking}
        />
      )}

      {agendaState.room && (
        <AgendaModal
          isOpen={agendaState.open}
          onClose={() => setAgendaState({ open: false, room: null })}
          room={agendaState.room}
          doctors={doctors as Doctor[]}
          bookings={bookingsByRoom[agendaState.room.id] || []}
          onUpdateStatus={updateBookingStatus}
        />
      )}
    </div>
  );
}
