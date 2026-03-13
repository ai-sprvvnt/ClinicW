'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, ArrowLeft, Trash2 } from 'lucide-react';
import { collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DoctorsAdminPage() {
  const { isAdmin, isLoading: isAdminLoading, user } = useIsAdmin();
  const db = useFirestore();
  
  const doctorsQuery = useMemoFirebase(() => {
    return collection(db, 'doctors');
  }, [db]);

  const { data: doctors, isLoading: isDoctorsLoading } = useCollection(doctorsQuery);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty || !user) return;

    const doctorsRef = collection(db, 'doctors');
    addDocumentNonBlocking(doctorsRef, {
      displayName: name,
      specialty,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      // Usamos una imagen aleatoria de nuestro set de placeholders para el demo
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`
    });

    setName('');
    setSpecialty('');
  };

  if (isAdminLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-center font-headline">No autorizado</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h2 className="text-3xl font-headline font-bold">Gestión de Médicos</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Nuevo Médico
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleAddDoctor}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Dra. Elena Vasquez" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Especialidad</label>
                  <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej. Cardiología" required />
                </div>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
                  Registrar Médico
                </Button>
              </CardContent>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Directorio Médico</CardTitle>
            </CardHeader>
            <CardContent>
              {isDoctorsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Médico</TableHead>
                      <TableHead>Especialidad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={doc.avatarUrl} />
                            <AvatarFallback>{doc.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{doc.displayName}</span>
                        </TableCell>
                        <TableCell>{doc.specialty}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {doctors?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No hay médicos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
