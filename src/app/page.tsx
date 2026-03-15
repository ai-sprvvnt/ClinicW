'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/header';
import { RoomCard } from '@/components/room-card';
import { BookingModal } from '@/components/booking-modal';
import { AgendaModal } from '@/components/agenda-modal';
import { ROOMS } from '@/lib/mock-data';
import type { Room, Booking, Doctor } from '@/lib/types';
import { useBookingManager } from '@/hooks/use-booking-manager';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { bookings, addBooking, updateBookingStatus, isLoading: isBookingsLoading } = useBookingManager();
  const db = useFirestore();
  
  // Fetch real doctors from Firestore
  const doctorsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'doctors');
  }, [db]);

  const { data: firestoreDoctors, isLoading: isDocsLoading } = useCollection(doctorsQuery);

  const doctors = useMemo(() => {
    if (!firestoreDoctors) return [];
    return firestoreDoctors.map(d => ({
      id: d.id,
      name: d.displayName,
      specialty: d.specialty,
      avatarUrl: d.avatarUrl
    })) as Doctor[];
  }, [firestoreDoctors]);

  const [modalState, setModalState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });

  const [agendaState, setAgendaState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenModal = (room: Room) => {
    setModalState({ open: true, room });
  };

  const handleCloseModal = () => {
    setModalState({ open: false, room: null });
  };

  const handleOpenAgenda = (room: Room) => {
    setAgendaState({ open: true, room });
  };

  const handleCloseAgenda = () => {
    setAgendaState({ open: false, room: null });
  };

  const bookingsByRoom = useMemo(() => {
    return bookings.reduce((acc, booking) => {
      if (!acc[booking.roomId]) {
        acc[booking.roomId] = [];
      }
      acc[booking.roomId].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);
  }, [bookings]);

  if (isBookingsLoading || isDocsLoading || isUserLoading) {
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
          {ROOMS.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              bookings={bookingsByRoom[room.id] || []}
              doctors={doctors}
              onBook={() => handleOpenModal(room)}
              onViewAgenda={() => handleOpenAgenda(room)}
              onUpdateStatus={updateBookingStatus}
              currentTime={currentTime}
            />
          ))}
        </div>
      </main>
      
      {modalState.room && (
        <BookingModal
          isOpen={modalState.open}
          onClose={handleCloseModal}
          room={modalState.room}
          doctors={doctors}
          bookings={bookingsByRoom[modalState.room.id] || []}
          onAddBooking={addBooking}
        />
      )}

      {agendaState.room && (
        <AgendaModal
          isOpen={agendaState.open}
          onClose={handleCloseAgenda}
          room={agendaState.room}
          doctors={doctors}
          bookings={bookingsByRoom[agendaState.room.id] || []}
        />
      )}
    </div>
  );
}
