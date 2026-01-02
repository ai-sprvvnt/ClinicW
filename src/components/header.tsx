import React from 'react';
import { ClinicWiseLogo } from './icons';

export const Header = () => {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <ClinicWiseLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-headline font-bold text-foreground">
            ClinicWise
          </h1>
        </div>
      </div>
    </header>
  );
};
