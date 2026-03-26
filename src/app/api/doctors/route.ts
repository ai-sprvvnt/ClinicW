import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const doctors = await prisma.doctor.findMany({
    orderBy: { displayName: 'asc' },
    include: { user: { select: { email: true } } },
  });
  return NextResponse.json({
    doctors: doctors.map((doctor) => ({
      ...doctor,
      email: doctor.user?.email || null,
    })),
  });
}

export async function POST(req: Request) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const { email, displayName, specialty, password, avatarUrl } = await req.json();
  if (!email || !displayName || !specialty || !password) {
    return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
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

  const passwordHash = await hashPassword(password);
  const createdUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'DOCTOR',
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      displayName,
      specialty,
      userId: createdUser.id,
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${createdUser.id}/200/200`,
    },
  });

  return NextResponse.json({ doctor });
}

export async function PUT(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, displayName, specialty, email, password, avatarUrl } = await req.json();
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
  if (password) userUpdates.passwordHash = await hashPassword(password);

  if (Object.keys(userUpdates).length > 0) {
    await prisma.user.update({
      where: { id: doctor.userId },
      data: userUpdates,
    });
  }

  const updatedDoctor = await prisma.doctor.update({
    where: { id },
    data: updates,
  });

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
    prisma.doctor.delete({ where: { id } }),
    prisma.user.delete({ where: { id: doctor.userId } }),
  ]);

  return NextResponse.json({ success: true });
}
