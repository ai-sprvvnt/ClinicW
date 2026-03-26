'use client';

import { useEffect, useState } from 'react';
import type { Room } from '@/lib/types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
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
  };

  useEffect(() => {
    let active = true;
    fetchRooms().finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, []);

  return { rooms, isLoading, refetch: fetchRooms };
}
