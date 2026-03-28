import type { Metadata } from 'next';
import { PT_Sans, Space_Grotesk } from 'next/font/google';

import './globals.css';

import { BookingsProvider } from '@/components/bookings-provider';
import { DoctorsProvider } from '@/components/doctors-provider';
import { RoomsProvider } from '@/components/rooms-provider';
import { SessionProvider } from '@/components/session-provider';
import { SettingsProvider } from '@/components/settings-provider';
import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { Toaster } from '@/components/ui/toaster';
import { prisma } from '@/lib/db';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const clinicName = settings?.clinicName?.trim() || 'ClinicWise';
  return {
    title: clinicName,
    description: 'Gestion de Consultorios',
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const themePalette = settings?.themePalette || 'clinic';

  return (
    <html lang="en" suppressHydrationWarning data-palette={themePalette}>
      <body className={`${ptSans.variable} ${spaceGrotesk.variable} font-body antialiased bg-background`}>
        <SessionProvider>
          <SettingsProvider>
            <RoomsProvider>
              <DoctorsProvider>
                <BookingsProvider>
                  {children}
                  <SessionTimeoutWarning />
                </BookingsProvider>
              </DoctorsProvider>
            </RoomsProvider>
          </SettingsProvider>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
