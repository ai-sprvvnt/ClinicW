'use client';

import { useState } from 'react';
import { format, set } from 'date-fns';
import { initialBookings } from '@/lib/mock-data';
import type { Booking, AddBookingData, BookingStatus, AddBookingResult } from '@/lib/types';
import { checkOverlap } from '@/lib/utils';
import { automatedConflictResolution } from '@/ai/flows/automated-conflict-resolution';

export function useBookingManager() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const addBooking = async (data: AddBookingData): Promise<AddBookingResult> => {
    const dateKey = format(data.date, 'yyyy-MM-dd');
    const startAt = set(data.date, { hours: Math.floor(data.startMin / 60), minutes: data.startMin % 60, seconds: 0, milliseconds: 0 });
    const endAt = set(data.date, { hours: Math.floor(data.endMin / 60), minutes: data.endMin % 60, seconds: 0, milliseconds: 0 });

    const newBooking: Omit<Booking, 'id'> = {
      ...data,
      dateKey,
      startAt,
      endAt,
      status: 'reserved',
    };

    const existingBookingsForRoom = bookings.filter(
      (b) => b.roomId === newBooking.roomId && b.dateKey === newBooking.dateKey && b.status !== 'cancelled'
    );

    const hasConflict = checkOverlap(newBooking, existingBookingsForRoom);

    if (hasConflict) {
        try {
            const result = await automatedConflictResolution({
                roomId: newBooking.roomId,
                dateKey: newBooking.dateKey,
                startMin: newBooking.startMin,
                endMin: newBooking.endMin,
                doctorId: newBooking.doctorId,
            });

            if (result.hasConflict && result.suggestedSlots.length > 0) {
                return {
                    success: false,
                    suggestions: result.suggestedSlots,
                    reason: result.reason,
                };
            } else {
                 return { success: false, message: 'El horario seleccionado no está disponible y no se encontraron alternativas automáticas.' };
            }
        } catch (error) {
            console.error("AI conflict resolution failed:", error);
            return { success: false, message: 'Error al buscar alternativas. Por favor, intente otro horario manualmente.' };
        }
    }

    // No conflict, add booking
    const finalBooking: Booking = {
      ...newBooking,
      id: `booking-${Date.now()}`,
    };

    setBookings((prev) => [...prev, finalBooking]);
    return { success: true };
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  };

  return { bookings, addBooking, updateBookingStatus };
}
