'use client';

import { useMemo } from 'react';
import { format, set } from 'date-fns';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  useUser,
  addDocumentNonBlocking,
  updateDocumentNonBlocking 
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where } from 'firebase/firestore';
import type { Booking, AddBookingData, BookingStatus, AddBookingResult } from '@/lib/types';
import { checkOverlap } from '@/lib/utils';
import { automatedConflictResolution } from '@/ai/flows/automated-conflict-resolution';

export function useBookingManager() {
  const { user } = useUser();
  const db = useFirestore();

  // Suscripción en tiempo real a las reservas de hoy (y futuras para el dashboard)
  const bookingsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'bookings');
  }, [db]);

  const { data: firestoreBookings, isLoading } = useCollection(bookingsQuery);

  // Convertimos los Timestamps de Firestore a objetos Date de JS
  const bookings = useMemo(() => {
    if (!firestoreBookings) return [];
    return firestoreBookings.map(b => ({
      ...b,
      startAt: b.startAt?.toDate ? b.startAt.toDate() : new Date(b.startAt),
      endAt: b.endAt?.toDate ? b.endAt.toDate() : new Date(b.endAt),
    })) as Booking[];
  }, [firestoreBookings]);

  const addBooking = async (data: AddBookingData): Promise<AddBookingResult> => {
    if (!user) return { success: false, message: 'Debe iniciar sesión para reservar.' };

    const dateKey = format(data.date, 'yyyy-MM-dd');
    const startAt = set(data.date, { hours: Math.floor(data.startMin / 60), minutes: data.startMin % 60, seconds: 0, milliseconds: 0 });
    const endAt = set(data.date, { hours: Math.floor(data.endMin / 60), minutes: data.endMin % 60, seconds: 0, milliseconds: 0 });

    const newBookingData = {
      roomId: data.roomId,
      doctorId: data.doctorId,
      dateKey,
      startAt,
      endAt,
      startMin: data.startMin,
      endMin: data.endMin,
      status: 'confirmed' as BookingStatus,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    };

    // Validación de traslapes local antes de llamar a la IA o guardar
    const existingBookingsForRoom = bookings.filter(
      (b) => b.roomId === data.roomId && b.dateKey === dateKey && b.status !== 'cancelled'
    );

    const hasConflict = checkOverlap({ startMin: data.startMin, endMin: data.endMin }, existingBookingsForRoom);

    if (hasConflict) {
      try {
        const result = await automatedConflictResolution({
          roomId: data.roomId,
          dateKey: dateKey,
          startMin: data.startMin,
          endMin: data.endMin,
          doctorId: data.doctorId,
        });

        if (result.hasConflict && result.suggestedSlots.length > 0) {
          return {
            success: false,
            suggestions: result.suggestedSlots,
            reason: result.reason,
          };
        } else {
          return { success: false, message: 'Conflicto de horario detectado. Por favor elija otra hora.' };
        }
      } catch (error) {
        return { success: false, message: 'Error al validar conflicto. Intente de nuevo.' };
      }
    }

    // Si no hay conflicto, guardamos en Firestore
    const bookingsRef = collection(db, 'bookings');
    addDocumentNonBlocking(bookingsRef, newBookingData);

    return { success: true };
  };

  const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
    if (!db) return;
    const bookingRef = doc(db, 'bookings', bookingId);
    updateDocumentNonBlocking(bookingRef, { 
      status,
      updatedAt: serverTimestamp(),
      updatedBy: user?.uid 
    });
  };

  return { bookings, isLoading, addBooking, updateBookingStatus };
}
