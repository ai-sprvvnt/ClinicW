'use client';

import { useSessionUser } from '@/hooks/use-session-user';

/**
 * Hook para verificar si el usuario actual tiene privilegios de administrador.
 */
export function useIsAdmin() {
  const { user, isLoading } = useSessionUser();
  const isAdmin = user?.role === 'ADMIN';
  return { isAdmin, isLoading, user };
}
