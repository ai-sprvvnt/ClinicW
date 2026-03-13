'use client';

import React from 'react';
import { ClinicWiseLogo } from './icons';
import { useUser } from '@/firebase';
import { useIsAdmin } from '@/hooks/use-is-admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, User as UserIcon } from 'lucide-react';

export const Header = () => {
  const { user } = useUser();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <ClinicWiseLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-headline font-bold text-foreground">
            ClinicWise
          </h1>
        </Link>

        <div className="flex items-center gap-2">
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
                  <span className="hidden sm:inline">{user ? 'Mi Cuenta' : 'Acceso Staff'}</span>
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
