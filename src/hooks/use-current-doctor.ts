'use client';

import { useEffect, useState } from 'react';
import type { Doctor } from '@/lib/types';

export function useCurrentDoctor() {
  const [doctor, setDoctor] = useState<(Doctor & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/doctors/me', { credentials: 'include' });
        if (!res.ok) {
          if (active) setDoctor(null);
          return;
        }
        const data = await res.json();
        if (active) setDoctor(data.doctor || null);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { doctor, isLoading };
}
