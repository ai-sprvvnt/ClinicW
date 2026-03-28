'use client';

import { useRoomsContext } from '@/components/rooms-provider';

export function useRooms() {
  const { rooms, isLoading, refresh } = useRoomsContext();
  return { rooms, isLoading, refetch: refresh };
}
