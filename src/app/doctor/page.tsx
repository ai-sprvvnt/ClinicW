'use client';

import React, { useMemo, useState } from 'react';
import { Header } from '@/components/header';
import { RoomCard } from '@/components/room-card';
import { BookingModal } from '@/components/booking-modal';
import { AgendaModal } from '@/components/agenda-modal';
import type { Room, Booking, Doctor } from '@/lib/types';
import { useBookingManager } from '@/hooks/use-booking-manager';
import { useIsDoctor } from '@/hooks/use-is-doctor';
import { useCurrentDoctor } from '@/hooks/use-current-doctor';
import { useDoctors } from '@/hooks/use-doctors';
import { useRooms } from '@/hooks/use-rooms';
import { Loader2 } from 'lucide-react';

export default function DoctorPage() {
  const { isDoctor, isLoading: isDoctorLoading } = useIsDoctor();
  const { doctor, isLoading: isDoctorDocLoading } = useCurrentDoctor();
  const { bookings, addBooking, updateBookingStatus, isLoading: isBookingsLoading } = useBookingManager();
  const { rooms, isLoading: isRoomsLoading } = useRooms();
  const { doctors, isLoading: isDoctorsLoading } = useDoctors();

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

  if (isDoctorLoading || isDoctorDocLoading || isBookingsLoading || isRoomsLoading || isDoctorsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDoctor || !doctor) {
    return <div className="p-8 text-center font-headline">No autorizado</div>;
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
              doctors={doctors}
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
          doctors={doctors}
          bookings={bookingsByRoom[modalState.room.id] || []}
          onAddBooking={addBooking}
          lockedDoctorId={doctor.id}
        />
      )}

      {agendaState.room && (
        <AgendaModal
          isOpen={agendaState.open}
          onClose={() => setAgendaState({ open: false, room: null })}
          room={agendaState.room}
          doctors={doctors}
          bookings={bookingsByRoom[agendaState.room.id] || []}
          onUpdateStatus={updateBookingStatus}
        />
      )}
    </div>
  );
}
