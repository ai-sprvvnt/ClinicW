'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface AdminSettings {
  maxRooms: number | null;
  maxDoctors: number | null;
}

type AdminSettingsContextValue = {
  settings: AdminSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
  saveLimits: (payload: { maxRooms?: number | null; maxDoctors?: number | null }) => Promise<void>;
};

const AdminSettingsContext = createContext<AdminSettingsContextValue | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>({
    maxRooms: null,
    maxDoctors: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setSettings({
        maxRooms: data.settings?.maxRooms ?? null,
        maxDoctors: data.settings?.maxDoctors ?? null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveLimits = useCallback(async (payload: { maxRooms?: number | null; maxDoctors?: number | null }) => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo actualizar la configuración.');
    }

    const data = await res.json();
    setSettings({
      maxRooms: data.settings?.maxRooms ?? null,
      maxDoctors: data.settings?.maxDoctors ?? null,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AdminSettingsContextValue>(
    () => ({ settings, isLoading, refresh, saveLimits }),
    [settings, isLoading, refresh, saveLimits]
  );

  return <AdminSettingsContext.Provider value={value}>{children}</AdminSettingsContext.Provider>;
}

export function useAdminSettingsContext() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) {
    throw new Error('useAdminSettingsContext must be used within AdminSettingsProvider.');
  }
  return ctx;
}

