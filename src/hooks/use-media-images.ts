'use client';

import { useCallback, useEffect, useState } from 'react';

export interface MediaImage {
  id: string;
  url: string;
  filename: string;
}

export function useMediaImages() {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/media/images', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setImages(data.images || []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { images, isLoading, refresh };
}
