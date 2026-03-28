'use client';

import { useDoctorsContext } from '@/components/doctors-provider';

export function useDoctors() {
  const { doctors, isLoading, refresh } = useDoctorsContext();
  return { doctors, isLoading, refetch: refresh };
}
