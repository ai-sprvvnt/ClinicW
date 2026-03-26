'use client';

import { useCallback, useEffect, useState } from 'react';

export interface ClinicBranding {
  clinicName: string | null;
  logoUrl: string | null;
}

export function useSettings() {
  const [branding, setBranding] = useState<ClinicBranding>({
    clinicName: null,
    logoUrl: null,
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

  return { branding, isLoading, refresh };
}
