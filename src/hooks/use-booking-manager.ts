'use client';

import { useBookingsContext } from '@/components/bookings-provider';

export function useBookingManager() {
  return useBookingsContext();
}
