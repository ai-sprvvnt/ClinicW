'use client';

import { useMediaImagesContext } from '@/components/media-images-provider';

export function useMediaImages() {
  return useMediaImagesContext();
}
