import type { ReactNode } from 'react';
import { AdminSettingsProvider } from '@/components/admin-settings-provider';
import { MediaImagesProvider } from '@/components/media-images-provider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminSettingsProvider>
      <MediaImagesProvider>{children}</MediaImagesProvider>
    </AdminSettingsProvider>
  );
}
