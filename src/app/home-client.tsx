'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useSessionUser } from '@/hooks/use-session-user';
import { useSettings } from '@/hooks/use-settings';
import { Loader2 } from 'lucide-react';

export default function HomeClient() {
  const { user, isLoading } = useSessionUser();
  const { branding } = useSettings();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-10 text-center shadow-sm">
          <h2 className="text-3xl font-headline font-bold text-foreground">
            {branding.clinicName || 'ClinicWise'}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Acceso operativo para el personal de la clínica. Inicia sesión para gestionar salas y citas.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {user ? (
              <Link href="/agenda">
                <Button size="sm" className="font-bold">
                  Ir a la agenda
                </Button>
              </Link>
            ) : (
              <Link href="/admin">
                <Button size="sm" className="font-bold">
                  Acceso Staff
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
