'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/header';
import { RoomCard } from '@/components/room-card';
import { BookingModal } from '@/components/booking-modal';
import { ROOMS, DOCTORS } from '@/lib/mock-data';
import type { Room, Booking, AddBookingData } from '@/lib/types';
import { useBookingManager } from '@/hooks/use-booking-manager';

export default function Home() {
  const { bookings, addBooking, updateBookingStatus } = useBookingManager();
  const [modalState, setModalState] = useState<{ open: boolean; room: Room | null }>({
    open: false,
    room: null,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update time every minute
    return () => clearInterval(timer);
  }, []);

  const handleOpenModal = (room: Room) => {
    setModalState({ open: true, room });
  };

  const handleCloseModal = () => {
    setModalState({ open: false, room: null });
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
              doctors={DOCTORS}
              onBook={() => handleOpenModal(room)}
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
          doctors={DOCTORS}
          bookings={bookingsByRoom[modalState.room.id] || []}
          onAddBooking={addBooking}
        />
      )}
    </div>
  );
}
