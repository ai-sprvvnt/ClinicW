import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { getBlockedMinutesForEmail } from '@/lib/login-rate-limit';

function isValidPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

const staffTypes = ['Profesional', 'PracticasProfesionales', 'ServicioSocial', 'PersonalInterno'] as const;
type StaffType = (typeof staffTypes)[number];

function normalizeString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveStaffType(value: unknown): StaffType | null {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  return (staffTypes as readonly string[]).includes(value) ? (value as StaffType) : null;
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const doctors = await prisma.doctor.findMany({
    orderBy: { displayName: 'asc' },
    include: { user: { select: { email: true, role: true, canManageAdmins: true } } },
  });
  return NextResponse.json({
    doctors: doctors.map((doctor) => ({
      ...doctor,
      email: doctor.user?.email || null,
      role: doctor.user?.role || 'DOCTOR',
      canManageAdmins: doctor.user?.canManageAdmins || false,
      blockedMinutes: doctor.user?.email ? getBlockedMinutesForEmail(doctor.user.email) : 0,
    })),
  });
}

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const {
    email,
    displayName,
    specialty,
    password,
    avatarUrl,
    degree,
    license,
    career,
    roleDescription,
    staffType,
    isAdmin,
    canManageAdmins,
  } = await req.json();
  if (!email || !displayName || !specialty || !password) {
    return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' },
      { status: 400 }
    );
  }

  const parsedStaffType = resolveStaffType(staffType);
  if (staffType && !parsedStaffType) {
    return NextResponse.json({ message: 'Tipo de personal inválido.' }, { status: 400 });
  }
  const resolvedStaffType = parsedStaffType || 'Profesional';

  const normalizedLicense = normalizeString(license);
  if (resolvedStaffType === 'Profesional' && !normalizedLicense) {
    return NextResponse.json(
      { message: 'La cédula o licencia es obligatoria para personal profesional.' },
      { status: 400 }
    );
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  if (settings?.maxDoctors) {
    const count = await prisma.doctor.count();
    if (count >= settings.maxDoctors) {
      return NextResponse.json(
        { message: `Límite de médicos alcanzado (${settings.maxDoctors}).` },
        { status: 409 }
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: 'El usuario ya existe.' }, { status: 409 });
  }

  const wantsAdmin = isAdmin === true;
  const canAssignAdmins = !!user?.isSuperAdmin || !!user?.canManageAdmins;
  if (wantsAdmin && !canAssignAdmins) {
    return NextResponse.json({ message: 'No autorizado para asignar administradores.' }, { status: 403 });
  }
  if (canManageAdmins !== undefined && !user?.isSuperAdmin) {
    return NextResponse.json({ message: 'No autorizado para otorgar permisos de admin.' }, { status: 403 });
  }

  const passwordHash = await hashPassword(password);
  let doctor;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: wantsAdmin ? 'ADMIN' : 'DOCTOR',
          canManageAdmins: user?.isSuperAdmin ? canManageAdmins === true : false,
        },
      });

      const createdDoctor = await tx.doctor.create({
        data: {
          displayName,
          specialty,
          userId: createdUser.id,
          avatarUrl: avatarUrl || `https://picsum.photos/seed/${createdUser.id}/200/200`,
          degree: normalizeString(degree),
          license: normalizedLicense,
          career: normalizeString(career),
          roleDescription: normalizeString(roleDescription),
          staffType: resolvedStaffType,
        },
      });

      return { doctor: createdDoctor };
    });
    doctor = result.doctor;
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target : [];
      if (target.includes('license')) {
        return NextResponse.json({ message: 'La cédula ya está registrada.' }, { status: 409 });
      }
      if (target.includes('email')) {
        return NextResponse.json({ message: 'El usuario ya existe.' }, { status: 409 });
      }
    }
    throw error;
  }

  return NextResponse.json({ doctor });
}

export async function PUT(req: Request) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const {
    id,
    displayName,
    specialty,
    email,
    password,
    avatarUrl,
    degree,
    license,
    career,
    roleDescription,
    staffType,
    isAdmin,
    canManageAdmins,
  } = await req.json();
  if (!id) {
    return NextResponse.json({ message: 'ID requerido.' }, { status: 400 });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id }, include: { user: true } });
  if (!doctor) {
    return NextResponse.json({ message: 'Médico no encontrado.' }, { status: 404 });
  }

  if (email && email !== doctor.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'El correo ya está en uso.' }, { status: 409 });
    }
  }

  const updates: any = {};
  if (displayName) updates.displayName = displayName;
  if (specialty) updates.specialty = specialty;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const userUpdates: any = {};
  if (email) userUpdates.email = email;
  if (isAdmin !== undefined) {
    const wantsAdmin = isAdmin === true;
    const canAssignAdmins = !!user?.isSuperAdmin || !!user?.canManageAdmins;
    if (!canAssignAdmins) {
      return NextResponse.json({ message: 'No autorizado para cambiar el rol.' }, { status: 403 });
    }
    userUpdates.role = wantsAdmin ? 'ADMIN' : 'DOCTOR';
  }
  if (canManageAdmins !== undefined) {
    if (!user?.isSuperAdmin) {
      return NextResponse.json({ message: 'No autorizado para otorgar permisos de admin.' }, { status: 403 });
    }
    userUpdates.canManageAdmins = canManageAdmins === true;
  }
  if (password) {
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' },
        { status: 400 }
      );
    }
    userUpdates.passwordHash = await hashPassword(password);
  }

  const resolvedStaffType = resolveStaffType(staffType);
  if (staffType && !resolvedStaffType) {
    return NextResponse.json({ message: 'Tipo de personal inválido.' }, { status: 400 });
  }

  const nextStaffType = resolvedStaffType || doctor.staffType;
  const normalizedLicense = license === undefined ? doctor.license : normalizeString(license);
  if (nextStaffType === 'Profesional' && !normalizedLicense) {
    return NextResponse.json(
      { message: 'La cédula o licencia es obligatoria para personal profesional.' },
      { status: 400 }
    );
  }

  if (resolvedStaffType) updates.staffType = resolvedStaffType;
  if (degree !== undefined) updates.degree = normalizeString(degree);
  if (license !== undefined) updates.license = normalizedLicense;
  if (career !== undefined) updates.career = normalizeString(career);
  if (roleDescription !== undefined) updates.roleDescription = normalizeString(roleDescription);

  let updatedDoctor;
  try {
    updatedDoctor = await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: userUpdates,
        });
      }

      return tx.doctor.update({
        where: { id },
        data: updates,
      });
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target : [];
      if (target.includes('license')) {
        return NextResponse.json({ message: 'La cédula ya está registrada.' }, { status: 409 });
      }
      if (target.includes('email')) {
        return NextResponse.json({ message: 'El correo ya está en uso.' }, { status: 409 });
      }
    }
    throw error;
  }

  return NextResponse.json({ doctor: updatedDoctor });
}

export async function DELETE(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ message: 'ID requerido.' }, { status: 400 });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) {
    return NextResponse.json({ message: 'Médico no encontrado.' }, { status: 404 });
  }

  const now = new Date();
  const activeBookings = await prisma.booking.count({
    where: {
      doctorId: id,
      status: { not: 'cancelled' },
      endAt: { gt: now },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json({ message: 'El médico tiene reservas activas.' }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.booking.updateMany({
      where: {
        doctorId: id,
        OR: [
          { status: 'cancelled' },
          { endAt: { lte: now } },
        ],
      },
      data: { doctorId: null },
    }),
    prisma.session.deleteMany({ where: { userId: doctor.userId } }),
    prisma.doctor.delete({ where: { id } }),
    prisma.user.delete({ where: { id: doctor.userId } }),
  ]);

  return NextResponse.json({ success: true });
}
