'use client';

import { useSettingsContext } from '@/components/settings-provider';

export function useSettings() {
  return useSettingsContext();
}
