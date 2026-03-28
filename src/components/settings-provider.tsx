'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemePalette } from '@/lib/theme-palettes';

export interface ClinicBranding {
  clinicName: string | null;
  logoUrl: string | null;
  themePalette: ThemePalette;
}

type SettingsContextValue = {
  branding: ClinicBranding;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<ClinicBranding>(() => {
    const initialPalette =
      typeof document !== 'undefined'
        ? (document.documentElement.getAttribute('data-palette') as ThemePalette | null)
        : null;
    return {
      clinicName: null,
      logoUrl: null,
      themePalette: initialPalette || 'clinic',
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/branding');
      if (!res.ok) return;
      const data = await res.json();
      setBranding({
        clinicName: data.clinicName ?? null,
        logoUrl: data.logoUrl ?? null,
        themePalette: data.themePalette ?? 'clinic',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const safeRefresh = async () => {
      if (!active) return;
      await refresh();
    };
    safeRefresh();
    const handler = () => {
      safeRefresh();
    };
    window.addEventListener('branding-updated', handler);
    return () => {
      active = false;
      window.removeEventListener('branding-updated', handler);
    };
  }, [refresh]);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', branding.themePalette || 'clinic');
  }, [branding.themePalette]);

  const value = useMemo<SettingsContextValue>(() => ({ branding, isLoading, refresh }), [branding, isLoading, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettingsContext must be used within SettingsProvider.');
  }
  return ctx;
}
