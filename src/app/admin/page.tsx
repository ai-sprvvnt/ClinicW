'use client';

import React, { useState } from 'react';
import { useAuth, initiateEmailSignIn, useUser } from '@/firebase';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Users, ShieldAlert, LogOut, ArrowRight, Copy } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    initiateEmailSignIn(auth, email, password);
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({
        title: "UID Copiado",
        description: "Puedes pegarlo en la colección roles_admin de Firestore.",
      });
    }
  };

  if (isUserLoading || (user && isAdminLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Panel Administrativo</CardTitle>
              <CardDescription>Inicie sesión para gestionar la clínica.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">Entrar</Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader className="text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="text-xl font-headline mt-4">Acceso Denegado</CardTitle>
              <CardDescription className="space-y-4">
                <p>Su cuenta ({user.email}) no tiene permisos administrativos.</p>
                <div className="bg-muted p-3 rounded-md text-xs font-mono break-all flex flex-col gap-2">
                  <span className="text-muted-foreground uppercase text-[10px] font-bold">Tu UID:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{user.uid}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={copyUid}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Para habilitar el acceso manual, crea un documento con este UID en la colección 'roles_admin' de Firestore.
                </p>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => signOut(auth)}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-headline font-bold">Panel de Control</h2>
            <p className="text-muted-foreground">Bienvenido, {user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut(auth)}>
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/doctors">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Gestión de Médicos</CardTitle>
                <CardDescription>Alta, baja y edición de profesionales médicos.</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <span className="text-sm font-bold flex items-center text-primary group-hover:gap-2 transition-all">
                  Administrar <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardFooter>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
