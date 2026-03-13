'use client';

import React from 'react';
import { ClinicWiseLogo } from './icons';
import { useIsAdmin } from '@/hooks/use-is-admin';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export const Header = () => {
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

        {isAdmin && (
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="font-bold gap-2">
              <Settings className="h-4 w-4" /> Panel Admin
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
