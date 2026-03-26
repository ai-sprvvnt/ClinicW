'use client';

import React, { useState, useMemo } from 'react';
import { Header } from '@/components/header';
import { RoomCard } from '@/components/room-card';
import { BookingModal } from '@/components/booking-modal';
import { AgendaModal } from '@/components/agenda-modal';
import type { Room, Booking, Doctor } from '@/lib/types';
import { useBookingManager } from '@/hooks/use-booking-manager';
import { useDoctors } from '@/hooks/use-doctors';
import { useRooms } from '@/hooks/use-rooms';
import { useSessionUser } from '@/hooks/use-session-user';
import { useSettings } from '@/hooks/use-settings';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading: isUserLoading } = useSessionUser();
  const { bookings, addBooking, updateBookingStatus, isLoading: isBookingsLoading } = useBookingManager();
  const { doctors, isLoading: isDocsLoading } = useDoctors();
  const { rooms, isLoading: isRoomsLoading } = useRooms();
  const { branding } = useSettings();

  const [modalState, setModalState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });

  const [agendaState, setAgendaState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });

  const bookingsByRoom = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.roomId]) {
        acc[booking.roomId] = [];
      }
      acc[booking.roomId].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [bookings]);

  if (isBookingsLoading || isDocsLoading || isUserLoading || isRoomsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              bookings={bookingsByRoom[room.id] || []}
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
