'use client';

import React, { useState } from 'react';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { useDoctors } from '@/hooks/use-doctors';
import { useSessionUser } from '@/hooks/use-session-user';
import { useMediaImages } from '@/hooks/use-media-images';
import { useAdminSettingsContext } from '@/components/admin-settings-provider';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, ArrowLeft, Trash2, Pencil, Unlock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DoctorsAdminPage() {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { doctors, isLoading: isDoctorsLoading, refetch: refetchDoctors } = useDoctors();
  const { user } = useSessionUser();
  const { images, isLoading: isMediaLoading } = useMediaImages();
  const { settings, saveLimits } = useAdminSettingsContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [staffType, setStaffType] = useState('Profesional');
  const [degree, setDegree] = useState('');
  const [license, setLicense] = useState('');
  const [career, setCareer] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [isAdminAccount, setIsAdminAccount] = useState(false);
  const [canManageAdminsAccount, setCanManageAdminsAccount] = useState(false);
  const [maxDoctors, setMaxDoctors] = useState<string>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editStaffType, setEditStaffType] = useState('Profesional');
  const [editDegree, setEditDegree] = useState('');
  const [editLicense, setEditLicense] = useState('');
  const [editCareer, setEditCareer] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editIsAdminAccount, setEditIsAdminAccount] = useState(false);
  const [editCanManageAdminsAccount, setEditCanManageAdminsAccount] = useState(false);
  const [confirmDemoteOpen, setConfirmDemoteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDoctor, setDeleteDoctor] = useState<any | null>(null);

  const isValidPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialty || !email || !password) return;
    if (staffType === 'Profesional' && !license.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cédula requerida',
        description: 'La cédula o licencia es obligatoria para personal profesional.',
      });
      return;
    }
    if (!isValidPassword(password)) {
      toast({
        variant: 'destructive',
        title: 'Contraseña inválida',
        description: 'Debe tener mínimo 8 caracteres, con mayúscula, minúscula y número.',
      });
      return;
    }

    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        displayName: name,
        specialty,
        password,
        avatarUrl: avatarUrl.trim() || null,
        staffType,
        degree,
        license,
        career,
        roleDescription,
        isAdmin: isAdminAccount,
        canManageAdmins: canManageAdminsAccount,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({
        variant: 'destructive',
        title: 'Error al crear médico',
        description: err.message || 'No se pudo crear el médico.',
      });
      return;
    }

    toast({
      title: 'Médico creado',
      description: 'El usuario del médico ha sido registrado.',
    });

    setName('');
    setSpecialty('');
    setEmail('');
    setPassword('');
    setAvatarUrl('');
    setStaffType('Profesional');
    setDegree('');
    setLicense('');
    setCareer('');
    setRoleDescription('');
    setIsAdminAccount(false);
    setCanManageAdminsAccount(false);

    window.location.reload();
  };

  const handleSaveMaxDoctors = async () => {
    const value = maxDoctors.trim();
    try {
      await saveLimits({ maxDoctors: value === '' ? null : Number(value) });
      setMaxDoctors('');
      toast({ title: 'Actualizado', description: 'El máximo de médicos fue actualizado.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'No se pudo actualizar el máximo.' });
    }
  };

  const openEdit = (doc: any) => {
    setEditDoctorId(doc.id);
    setEditName(doc.displayName || doc.name || '');
    setEditSpecialty(doc.specialty || '');
    setEditEmail(doc.email || '');
    setEditPassword('');
    setEditAvatarUrl(doc.avatarUrl || '');
    setEditStaffType(doc.staffType || 'Profesional');
    setEditDegree(doc.degree || '');
    setEditLicense(doc.license || '');
    setEditCareer(doc.career || '');
    setEditRoleDescription(doc.roleDescription || '');
    setEditIsAdminAccount(doc.role === 'ADMIN');
    setEditCanManageAdminsAccount(!!doc.canManageAdmins);
    setEditOpen(true);
  };

  const handleUpdateDoctor = async () => {
    if (!editDoctorId) return;
    if (editStaffType === 'Profesional' && !editLicense.trim()) {
      toast({
        variant: 'destructive',
        title: 'Cédula requerida',
        description: 'La cédula o licencia es obligatoria para personal profesional.',
      });
      return;
    }
    if (editPassword && !isValidPassword(editPassword)) {
      toast({
        variant: 'destructive',
        title: 'Contraseña inválida',
        description: 'Debe tener mínimo 8 caracteres, con mayúscula, minúscula y número.',
      });
      return;
    }
    const res = await fetch('/api/doctors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: editDoctorId,
        displayName: editName,
        specialty: editSpecialty,
        email: editEmail,
        password: editPassword || undefined,
        avatarUrl: editAvatarUrl.trim() || null,
        staffType: editStaffType,
        degree: editDegree,
        license: editLicense,
        career: editCareer,
        roleDescription: editRoleDescription,
        isAdmin: editIsAdminAccount,
        canManageAdmins: editCanManageAdminsAccount,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo actualizar.' });
      return;
    }

    toast({ title: 'Actualizado', description: 'Datos del médico actualizados.' });
    setEditOpen(false);
    window.location.reload();
  };

  const handleDeleteDoctor = async () => {
    if (!deleteDoctor) return;
    const res = await fetch('/api/doctors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: deleteDoctor.id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo eliminar.' });
      return;
    }

    toast({ title: 'Eliminado', description: 'El médico fue eliminado.' });
    setDeleteOpen(false);
    setDeleteDoctor(null);
    window.location.reload();
  };

  const handleUnblockDoctor = async (email: string) => {
    const res = await fetch('/api/auth/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'No se pudo desbloquear.' });
      return;
    }

    toast({ title: 'Desbloqueado', description: 'El bloqueo fue eliminado.' });
    void refetchDoctors();
  };

  if (isAdminLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-center font-headline">No autorizado</div>;
  }

  const isSuperAdmin = !!user?.isSuperAdmin;
  const canAssignAdmins = isSuperAdmin || !!user?.canManageAdmins;
  const currentMaxDoctors = settings.maxDoctors;
  const maxReached = currentMaxDoctors !== null && doctors.length >= currentMaxDoctors;

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
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Dra. Elena Vasquez"
                    required
                    className={!name.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo del Médico</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@medico.com"
                    required
                    className={!email.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Especialidad</label>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej. Cardiología"
                    required
                    className={!specialty.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Personal</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={staffType}
                    onChange={(e) => setStaffType(e.target.value)}
                  >
                    <option value="Profesional">Profesional</option>
                    <option value="PracticasProfesionales">Prácticas Profesionales</option>
                    <option value="ServicioSocial">Servicio Social</option>
                    <option value="PersonalInterno">Personal Interno</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título Profesional</label>
                  <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="Ej. Médico Cirujano" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cédula o Licencia</label>
                  <Input
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="Ej. 1234567"
                    className={staffType === 'Profesional' && !license.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  {staffType === 'Profesional' && (
                    <p className="text-xs text-muted-foreground">Obligatoria para personal profesional.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trayectoria/Carrera</label>
                  <Input value={career} onChange={(e) => setCareer(e.target.value)} placeholder="Breve historial profesional" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qué hace</label>
                  <Input value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Funciones dentro de la clínica" />
                </div>
                {canAssignAdmins && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isAdminAccount}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsAdminAccount(checked);
                        if (!checked) setCanManageAdminsAccount(false);
                      }}
                    />
                    ¿Registrar como Administrador?
                  </label>
                )}
                {isSuperAdmin && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={canManageAdminsAccount}
                      onChange={(e) => setCanManageAdminsAccount(e.target.checked)}
                      disabled={!isAdminAccount}
                    />
                    Puede administrar administradores
                  </label>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña inicial</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={!password.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, con mayúscula, minúscula y número.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Biblioteca de imágenes</p>
                  <div className="grid grid-cols-6 gap-2">
                    {images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        className={cn(
                          'h-10 w-10 rounded border bg-background p-1',
                          avatarUrl === img.url && 'ring-2 ring-primary'
                        )}
                        onClick={() => setAvatarUrl(img.url)}
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
                <Button
                  type="submit"
                  disabled={maxReached}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold disabled:opacity-60"
                >
                  Registrar Médico
                </Button>
                {maxReached && (
                  <p className="text-xs text-destructive">
                    Se alcanzó el límite de médicos permitido.
                  </p>
                )}
              </CardContent>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Directorio Médico</CardTitle>
              <CardTitle className="text-sm text-muted-foreground">
                {currentMaxDoctors
                  ? `Límite actual: ${doctors.length}/${currentMaxDoctors}`
                  : `Sin límite configurado (${doctors.length} médicos)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDoctorsLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                  <TableHead>Médico</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors?.map((doc: any) => (
                      <TableRow key={doc.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={doc.avatarUrl} />
                            <AvatarFallback>{doc.displayName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{doc.displayName}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{doc.email || '—'}</TableCell>
                        <TableCell>{doc.specialty}</TableCell>
                        <TableCell>{doc.staffType || '—'}</TableCell>
                        <TableCell>{doc.license ? 'Con cédula' : 'Sin cédula'}</TableCell>
                        <TableCell className="text-right flex items-center justify-end gap-2">
                          {doc.blockedMinutes > 0 && doc.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title={`Bloqueado: ${doc.blockedMinutes} minuto(s). Desbloquear`}
                              onClick={() => handleUnblockDoctor(doc.email)}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(doc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleteDoctor(doc);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {doctors?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay médicos registrados.
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
                    placeholder="Máximo de médicos (vacío = sin límite)"
                    value={maxDoctors}
                    onChange={(e) => setMaxDoctors(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleSaveMaxDoctors}>Guardar</Button>
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
        <DialogContent className="max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Editar Médico</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(85vh-132px)] overflow-y-auto px-6 pb-6 space-y-3 pt-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre"
              className={!editName.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            <Input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Correo"
              className={!editEmail.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            <Input
              value={editSpecialty}
              onChange={(e) => setEditSpecialty(e.target.value)}
              placeholder="Especialidad"
              className={!editSpecialty.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={editStaffType}
              onChange={(e) => setEditStaffType(e.target.value)}
            >
              <option value="Profesional">Profesional</option>
              <option value="PracticasProfesionales">Prácticas Profesionales</option>
              <option value="ServicioSocial">Servicio Social</option>
              <option value="PersonalInterno">Personal Interno</option>
            </select>
            <Input value={editDegree} onChange={(e) => setEditDegree(e.target.value)} placeholder="Título Profesional" />
            <Input
              value={editLicense}
              onChange={(e) => setEditLicense(e.target.value)}
              placeholder="Cédula o Licencia"
              className={editStaffType === 'Profesional' && !editLicense.trim() ? 'border-destructive focus-visible:ring-destructive' : undefined}
            />
            <Input value={editCareer} onChange={(e) => setEditCareer(e.target.value)} placeholder="Trayectoria/Carrera" />
            <Input value={editRoleDescription} onChange={(e) => setEditRoleDescription(e.target.value)} placeholder="Qué hace" />
            {canAssignAdmins && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editIsAdminAccount}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (!checked) {
                      setConfirmDemoteOpen(true);
                      return;
                    }
                    setEditIsAdminAccount(true);
                  }}
                />
                ¿Administrador?
              </label>
            )}
            {isSuperAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editCanManageAdminsAccount}
                  onChange={(e) => setEditCanManageAdminsAccount(e.target.checked)}
                  disabled={!editIsAdminAccount}
                />
                Puede administrar administradores
              </label>
            )}
            <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nueva contraseña (opcional)" />
            <p className="text-xs text-muted-foreground">
              Si cambias la contraseña: mínimo 8 caracteres, con mayúscula, minúscula y número.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Biblioteca de imágenes</p>
              <div className="grid grid-cols-6 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={cn(
                      'h-10 w-10 rounded border bg-background p-1',
                      editAvatarUrl === img.url && 'ring-2 ring-primary'
                    )}
                    onClick={() => setEditAvatarUrl(img.url)}
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
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateDoctor}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDemoteOpen} onOpenChange={setConfirmDemoteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de rol</AlertDialogTitle>
            <AlertDialogDescription>
              Estás quitando privilegios de administrador. Esta persona perderá acceso a las pantallas de administración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setEditIsAdminAccount(false);
                setEditCanManageAdminsAccount(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar médico?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el usuario del médico. Las reservas pasadas quedarán en historial sin médico asignado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDoctor(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
