'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Room } from '@/lib/types';

type RoomsContextValue = {
  rooms: Room[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const RoomsContext = createContext<RoomsContextValue | undefined>(undefined);

export function RoomsProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rooms', { credentials: 'include' });
      if (!res.ok) {
        setRooms([]);
        return;
      }
      const data = await res.json();
      setRooms(data.rooms || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<RoomsContextValue>(() => ({ rooms, isLoading, refresh }), [rooms, isLoading, refresh]);
  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
}

export function useRoomsContext() {
  const ctx = useContext(RoomsContext);
  if (!ctx) {
    throw new Error('useRoomsContext must be used within RoomsProvider.');
  }
  return ctx;
}

