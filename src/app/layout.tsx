import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SessionTimeoutWarning } from '@/components/session-timeout-warning';
import { prisma } from '@/lib/db';
import { PT_Sans, Space_Grotesk } from 'next/font/google';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${spaceGrotesk.variable} font-body antialiased bg-background`}>
        {children}

        <SessionTimeoutWarning />
        <Toaster />
      </body>
    </html>
  );
}


