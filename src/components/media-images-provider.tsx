'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface MediaImage {
  id: string;
  url: string;
  filename: string;
}

type MediaImagesContextValue = {
  images: MediaImage[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const MediaImagesContext = createContext<MediaImagesContextValue | undefined>(undefined);

export function MediaImagesProvider({ children }: { children: React.ReactNode }) {
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
    void refresh();
  }, [refresh]);

  const value = useMemo<MediaImagesContextValue>(() => ({ images, isLoading, refresh }), [images, isLoading, refresh]);
  return <MediaImagesContext.Provider value={value}>{children}</MediaImagesContext.Provider>;
}

export function useMediaImagesContext() {
  const ctx = useContext(MediaImagesContext);
  if (!ctx) {
    throw new Error('useMediaImagesContext must be used within MediaImagesProvider.');
  }
  return ctx;
}

