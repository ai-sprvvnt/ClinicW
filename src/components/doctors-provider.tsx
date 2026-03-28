'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Doctor } from '@/lib/types';

type DoctorsContextValue = {
  doctors: Doctor[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const DoctorsContext = createContext<DoctorsContextValue | undefined>(undefined);

export function DoctorsProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/doctors', { credentials: 'include' });
      if (!res.ok) {
        setDoctors([]);
        return;
      }
      const data = await res.json();
      const mapped = (data.doctors || []).map((d: any) => ({
        ...d,
        name: d.name || d.displayName,
        email: d.email || d.user?.email || null,
      }));
      setDoctors(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<DoctorsContextValue>(() => ({ doctors, isLoading, refresh }), [doctors, isLoading, refresh]);
  return <DoctorsContext.Provider value={value}>{children}</DoctorsContext.Provider>;
}

export function useDoctorsContext() {
  const ctx = useContext(DoctorsContext);
  if (!ctx) {
    throw new Error('useDoctorsContext must be used within DoctorsProvider.');
  }
  return ctx;
}

