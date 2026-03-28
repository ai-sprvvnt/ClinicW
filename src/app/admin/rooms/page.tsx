'use client';

import React, { useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useRooms } from '@/hooks/use-rooms';
import { useSessionUser } from '@/hooks/use-session-user';
import { useAdminSettingsContext } from '@/components/admin-settings-provider';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, Trash2, Pencil, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function RoomsAdminPage() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { rooms, isLoading: isRoomsLoading, refetch } = useRooms();
  const { user } = useSessionUser();
  const { settings, saveLimits } = useAdminSettingsContext();
  const { toast } = useToast();

  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('');
  const [maxRooms, setMaxRooms] = useState<string>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editRoomId, setEditRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoomType, setEditRoomType] = useState('');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !roomType) return;
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: roomName, roomType }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo crear el consultorio.' });
      return;
    }

    setRoomName('');
    setRoomType('');
    await refetch();
  };

  const handleSaveMaxRooms = async () => {
    const value = maxRooms.trim();
    try {
      await saveLimits({ maxRooms: value === '' ? null : Number(value) });
      setMaxRooms('');
      toast({ title: 'Actualizado', description: 'El máximo de consultorios fue actualizado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar el máximo.' });
    }
  };

  const openEdit = (room: any) => {
    setEditRoomId(room.id);
    setEditName(room.name || '');
    setEditRoomType(room.roomType || '');
    setEditOpen(true);
  };

  const handleUpdateRoom = async () => {
    if (!editRoomId) return;
    const res = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: editRoomId, name: editName, roomType: editRoomType }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo actualizar.' });
      return;
    }

    toast({ title: 'Actualizado', description: 'Consultorio actualizado.' });
    setEditOpen(false);
    await refetch();
  };

  const handleDeleteRoom = async (room: any) => {
    if (
      !confirm(
        `¿Eliminar el consultorio "${room.name}"?\n\n` +
          `Esta acción no se puede deshacer.\n` +
          `Se eliminarán también sus reservas históricas.\n\n` +
          `¿Deseas continuar?`
      )
    ) {
      return;
    }

    const res = await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: room.id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo eliminar.' });
      return;
    }

    toast({ title: 'Eliminado', description: 'Consultorio eliminado.' });
    await refetch();
  };

  if (isAdminLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-center font-headline">No autorizado</div>;
  }

  const isSuperAdmin = !!user?.isSuperAdmin;
  const currentMaxRooms = settings.maxRooms;
  const maxReached = currentMaxRooms !== null && rooms.length >= currentMaxRooms;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft /></Button>
          </Link>
          <h2 className="text-3xl font-headline font-bold">Gestión de Consultorios</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Nuevo Consultorio
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCreateRoom}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre del Consultorio</label>
                  <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ej. Consultorio 1" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Consultorio</label>
                  <Input value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="Ej. Psicológico, Médico, Pediatría" required />
                </div>
                <Button type="submit" disabled={maxReached} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold disabled:opacity-60">
                  Registrar Consultorio
                </Button>
                {maxReached && (
                  <p className="text-xs text-destructive">
                    Se alcanzó el límite de consultorios permitido.
                  </p>
                )}
              </CardContent>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Directorio de Consultorios</CardTitle>
              <CardTitle className="text-sm text-muted-foreground">
                {currentMaxRooms ? `Límite actual: ${rooms.length}/${currentMaxRooms}` : `Sin límite configurado (${rooms.length} consultorios)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRoomsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Consultorio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms?.map((room: any) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>{room.roomType || 'General'}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRoom(room)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rooms?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No hay consultorios registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {isSuperAdmin && (
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Input
                    placeholder="Máximo de consultorios (vacío = sin límite)"
                    value={maxRooms}
                    onChange={(e) => setMaxRooms(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSaveMaxRooms}>Guardar</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Solo el super admin puede cambiar el límite.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Consultorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" />
            <Input value={editRoomType} onChange={(e) => setEditRoomType(e.target.value)} placeholder="Tipo de consultorio" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateRoom}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
