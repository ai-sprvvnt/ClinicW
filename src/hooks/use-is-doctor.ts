'use client';

import { useSessionUser } from '@/hooks/use-session-user';

export function useIsDoctor() {
  const { user, isLoading } = useSessionUser();
  const isDoctor = user?.role === 'DOCTOR';
  return { isDoctor, isLoading, user };
}
