'use client';

import React, { useMemo, useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useSessionUser } from '@/hooks/use-session-user';
import { useBookingManager } from '@/hooks/use-booking-manager';
import { useRooms } from '@/hooks/use-rooms';
import { useDoctors } from '@/hooks/use-doctors';
import { useSettings } from '@/hooks/use-settings';
import { useMediaImages } from '@/hooks/use-media-images';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Users, LogOut, ArrowRight, FileDown, CalendarDays, CalendarRange, Building2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { exportToCSV, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format, cn } from '@/lib/utils';
import { THEME_PALETTES, THEME_PALETTE_LABELS, type ThemePalette } from '@/lib/theme-palettes';

export default function AdminPage() {
  const { user, isLoading: isUserLoading } = useSessionUser();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { bookings, isLoading: isBookingsLoading } = useBookingManager();
  const { rooms, isLoading: isRoomsLoading } = useRooms();
  const { doctors } = useDoctors();
  const { branding, isLoading: isBrandingLoading, refresh: refreshBranding } = useSettings();
  const { images, isLoading: isMediaLoading } = useMediaImages();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [themePalette, setThemePalette] = useState<ThemePalette>('clinic');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const initialBranding = useMemo(
    () => ({
      clinicName: branding.clinicName || '',
      logoUrl: branding.logoUrl || '',
      themePalette: branding.themePalette || 'clinic',
    }),
    [branding]
  );

  React.useEffect(() => {
    setClinicName(initialBranding.clinicName);
    setLogoUrl(initialBranding.logoUrl);
    setThemePalette(initialBranding.themePalette);
  }, [initialBranding.clinicName, initialBranding.logoUrl, initialBranding.themePalette]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Credenciales inválidas.',
      });
      return;
    }

    window.location.href = '/admin';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  };

  const copyUid = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast({
        title: 'ID Copiado',
        description: 'Copia el ID del usuario para auditoría local.',
      });
    }
  };

  const handleExport = async (type: 'week' | 'current_month' | 'last_month') => {
    const now = new Date();
    let start: Date, end: Date, fileName: string;
    const prefix = (branding.clinicName || '').trim();
    const namePrefix = prefix.length > 0 ? `${prefix}_` : '';

    if (type === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      fileName = `${namePrefix}reporte_semanal_${format(now, 'yyyy-MM-dd')}.csv`;
    } else if (type === 'current_month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
      fileName = `${namePrefix}reporte_mensual_actual_${format(now, 'yyyy-MM')}.csv`;
    } else {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      fileName = `${namePrefix}reporte_mensual_anterior_${format(start, 'yyyy-MM')}.csv`;
    }

    const roomsById = new Map(rooms.map(r => [r.id, r.name]));
    const doctorsById = new Map(doctors.map(d => [d.id, d.name || d.displayName || '']));

    const data = bookings
      .filter(b => b.startAt >= start && b.startAt <= end)
      .map(b => ({
        Fecha: b.dateKey,
        Inicio: format(b.startAt, 'HH:mm'),
        Fin: format(b.endAt, 'HH:mm'),
        Consultorio: roomsById.get(b.roomId) || '',
        Medico: b.doctorId ? (doctorsById.get(b.doctorId) || '') : '',
        Estado: b.status,
        Creado: format(b.startAt, 'yyyy-MM-dd HH:mm')
      }));

    if (data.length === 0) {
      toast({ variant: 'destructive', title: 'Sin datos', description: 'No se encontraron registros para este periodo.' });
      return;
    }

    try {
      await exportToCSV(data, fileName);
      toast({ title: 'Listo', description: 'El reporte se descargó correctamente.' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error?.message || 'No se pudo generar el reporte.',
      });
    }
  };

  if (isUserLoading || isAdminLoading || isBookingsLoading || isRoomsLoading) {
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
    window.location.href = '/doctor';
    return null;
  }

  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    try {
      const res = await fetch('/api/settings/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clinicName: clinicName.trim() || null,
          logoUrl: logoUrl.trim() || null,
          themePalette,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar');
      }

      await refreshBranding();
      window.dispatchEvent(new Event('branding-updated'));
      toast({ title: 'Listo', description: 'Branding actualizado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar el branding.' });
    } finally {
      setIsSavingBranding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-headline font-bold">Panel de Control</h2>
            <p className="text-muted-foreground">Bienvenido, {user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
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

          <Link href="/admin/rooms">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardHeader>
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Consultorios</CardTitle>
                <CardDescription>Administrar consultorios y límites.</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto">
                <span className="text-sm font-bold flex items-center text-primary group-hover:gap-2 transition-all">
                  Administrar <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardFooter>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow h-full md:col-span-2 lg:col-span-1">
            <CardHeader>
              <FileDown className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Reportes de Agenda</CardTitle>
              <CardDescription>Descargar historial de reservas en formato CSV.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => handleExport('week')}
              >
                <CalendarDays className="mr-2 h-4 w-4" /> Semana Actual (L-D)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => handleExport('current_month')}
              >
                <CalendarRange className="mr-2 h-4 w-4" /> Mes Actual
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={() => handleExport('last_month')}
              >
                <FileDown className="mr-2 h-4 w-4" /> Mes Anterior
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow h-full md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Nombre visible y logotipo en el encabezado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="Nombre de la clínica"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>
              {logoUrl.trim().length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Vista previa</p>
                  <Image
                    src={logoUrl}
                    alt="Logotipo"
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 object-contain"
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Biblioteca de imágenes</p>
                <div className="grid grid-cols-6 gap-2">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className={cn(
                        'h-10 w-10 rounded border bg-background p-1',
                        logoUrl === img.url && 'ring-2 ring-primary'
                      )}
                      onClick={() => setLogoUrl(img.url)}
                      title={img.filename}
                    >
                      <Image
                        src={img.url}
                        alt="img"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                  {!isMediaLoading && images.length === 0 && (
                    <p className="col-span-6 text-xs text-muted-foreground">Sin imágenes aún.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Paleta de colores</p>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PALETTES.map((palette) => (
                    <button
                      key={palette}
                      type="button"
                      className={cn(
                        'rounded border px-3 py-2 text-left text-sm',
                        themePalette === palette ? 'ring-2 ring-primary border-primary' : 'hover:bg-muted/40'
                      )}
                      onClick={() => setThemePalette(palette)}
                    >
                      {THEME_PALETTE_LABELS[palette]}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isSavingBranding || isBrandingLoading}
                onClick={handleSaveBranding}
              >
                {isSavingBranding ? 'Guardando...' : 'Guardar branding'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
