'use client';

import { useEffect, useState } from 'react';

export interface SessionUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR';
  isSuperAdmin?: boolean;
  displayName?: string | null;
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (active) setUser(null);
          return;
        }
        const data = await res.json();
        if (active) setUser(data.user || null);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { user, isLoading };
}
