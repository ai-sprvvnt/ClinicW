'use client';

import { useSessionContext } from '@/components/session-provider';

export interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR';
  isSuperAdmin?: boolean;
  displayName?: string | null;
}

export function useSessionUser() {
  const { user, isLoading, refresh } = useSessionContext();
  return { user, isLoading, refresh };
}
