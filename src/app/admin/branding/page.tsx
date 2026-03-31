'use client';

import React, { useMemo, useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useSessionUser } from '@/hooks/use-session-user';
import { useSettings } from '@/hooks/use-settings';
import { useMediaImages } from '@/hooks/use-media-images';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { THEME_PALETTES, THEME_PALETTE_LABELS, type ThemePalette } from '@/lib/theme-palettes';

export default function BrandingAdminPage() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { user } = useSessionUser();
  const { branding, isLoading: isBrandingLoading, refresh: refreshBranding } = useSettings();
  const { images, isLoading: isMediaLoading } = useMediaImages();
  const { toast } = useToast();

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

  if (isAdminLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Branding
            </h2>
            <p className="text-muted-foreground text-sm">
              Ajusta nombre visible, logo y paleta de colores.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Datos de la clínica</CardTitle>
              <CardDescription>Nombre y logo usados en el encabezado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Input
                  placeholder="Nombre de la clínica"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="URL del logo (opcional)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
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

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Biblioteca de imágenes</CardTitle>
              <CardDescription>Selecciona una imagen guardada como logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={cn(
                      'h-12 w-12 rounded border bg-background p-1',
                      logoUrl === img.url && 'ring-2 ring-primary'
                    )}
                    onClick={() => setLogoUrl(img.url)}
                    title={img.filename}
                  >
                    <Image
                      src={img.url}
                      alt="img"
                      width={48}
                      height={48}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
                {!isMediaLoading && images.length === 0 && (
                  <p className="col-span-6 text-xs text-muted-foreground">Sin imágenes aún.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Paleta de colores</CardTitle>
              <CardDescription>Selecciona el estilo visual de la interfaz.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
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
