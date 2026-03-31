'use client';

import React, { useState } from 'react';
import { ClinicWiseLogo } from './icons';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useIsDoctor } from '@/hooks/use-is-doctor';
import { useSessionUser } from '@/hooks/use-session-user';
import { useSettings } from '@/hooks/use-settings';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarDays, LogOut, Settings, User as UserIcon, Stethoscope } from 'lucide-react';

export const Header = () => {
  const { user } = useSessionUser();
  const { isAdmin } = useIsAdmin();
  const { isDoctor } = useIsDoctor();
  const { branding } = useSettings();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.clinicName || 'ClinicWise'}
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded object-contain"
            />
          ) : (
            <ClinicWiseLogo className="h-8 w-8 text-primary" />
          )}
          <h1 className="text-xl font-headline font-bold text-foreground">
            {branding.clinicName || 'ClinicWise'}
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Agenda</span>
              </Button>
            </Link>
          ) : null}
          {isDoctor && !isAdmin && (
            <Link href="/doctor">
              <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary">
                <Stethoscope className="h-4 w-4" />
                <span className="hidden sm:inline">Mi Agenda</span>
              </Button>
            </Link>
          )}
          {user ? (
            <span className="hidden md:inline text-xs font-medium text-muted-foreground">
              {user.role === 'DOCTOR' && user.displayName
                ? `${user.displayName} · ${user.email}`
                : user.email}
            </span>
          ) : null}
          {isAdmin || !user ? (
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary">
                {isAdmin ? (
                  <>
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Panel Admin</span>
                  </>
                ) : (
                  <>
                    <UserIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Acceso Staff</span>
                  </>
                )}
              </Button>
            </Link>
          ) : null}
          {user ? (
            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="font-bold gap-2 text-muted-foreground hover:text-primary">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se cerrará tu sesión actual y tendrás que volver a iniciar para continuar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Salir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>
    </header>
  );
};
