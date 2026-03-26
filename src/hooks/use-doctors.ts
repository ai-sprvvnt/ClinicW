'use client';

import { useEffect, useState } from 'react';
import type { Doctor } from '@/lib/types';

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/doctors', { credentials: 'include' });
        if (!res.ok) {
          if (active) setDoctors([]);
          return;
        }
        const data = await res.json();
        if (active) {
          const mapped = (data.doctors || []).map((d: any) => ({
            ...d,
            name: d.name || d.displayName,
            email: d.email || d.user?.email || null,
          }));
          setDoctors(mapped);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { doctors, isLoading };
}
