'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, set } from 'date-fns';
import type { Booking, AddBookingData, BookingStatus, AddBookingResult } from '@/lib/types';
import { checkOverlap } from '@/lib/utils';

export function useBookingManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/bookings', { credentials: 'include' });
        if (!res.ok) {
          if (active) setBookings([]);
          return;
        }
        const data = await res.json();
        const parsed = (data.bookings || []).map((b: any) => ({
          ...b,
          startAt: new Date(b.startAt),
          endAt: new Date(b.endAt),
        })) as Booking[];
        if (active) setBookings(parsed);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const addBooking = async (data: AddBookingData): Promise<AddBookingResult> => {
    const dateKey = format(data.date, 'yyyy-MM-dd');
    const startAt = set(data.date, { hours: Math.floor(data.startMin / 60), minutes: data.startMin % 60, seconds: 0, milliseconds: 0 });
    const endAt = set(data.date, { hours: Math.floor(data.endMin / 60), minutes: data.endMin % 60, seconds: 0, milliseconds: 0 });

    // Validación de traslapes local antes de llamar al servidor
    const hasRoomConflict = checkOverlap(
      { startMin: data.startMin, endMin: data.endMin }, 
      bookings.filter(b => b.roomId === data.roomId && b.dateKey === dateKey && b.status !== 'cancelled')
    );

    const hasDoctorConflict = checkOverlap(
      { startMin: data.startMin, endMin: data.endMin },
      bookings.filter(b => b.doctorId === data.doctorId && b.roomId !== data.roomId && b.dateKey === dateKey && b.status !== 'cancelled')
    );

    if (hasRoomConflict || hasDoctorConflict) {
      const conflictMsg = hasDoctorConflict 
        ? 'El médico ya tiene una reserva en otro consultorio a esta misma hora.'
        : 'El consultorio ya está ocupado en este horario.';
      return { success: false, message: `${conflictMsg} Por favor elija otra hora.` };
    }

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        roomId: data.roomId,
        doctorId: data.doctorId,
        dateKey,
        startMin: data.startMin,
        endMin: data.endMin,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || 'No se pudo crear la reserva.' };
    }

    const created = await res.json();
    const booking = created.booking as Booking;
    setBookings(prev => prev.concat([{ ...booking, startAt: new Date(booking.startAt), endAt: new Date(booking.endAt) }]));

    return { success: true };
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    await fetch('/api/bookings/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ bookingId, status }),
    });

    setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status } : b)));
  };

  return { bookings, isLoading, addBooking, updateBookingStatus };
}
