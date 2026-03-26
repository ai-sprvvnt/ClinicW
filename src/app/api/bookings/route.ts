import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/api-auth';

function hasOverlap(startMin: number, endMin: number, existing: { startMin: number; endMin: number }) {
  return startMin < existing.endMin && endMin > existing.startMin;
}

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  if (user.role === 'ADMIN') {
    const bookings = await prisma.booking.findMany();
    return NextResponse.json({ bookings });
  }

  const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) return NextResponse.json({ bookings: [] });

  const bookings = await prisma.booking.findMany();
  return NextResponse.json({ bookings });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { roomId, doctorId, dateKey, startMin, endMin, startAt, endAt } = await req.json();
  if (!roomId || !doctorId || !dateKey || startMin == null || endMin == null || !startAt || !endAt) {
    return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
  }

  const targetDoctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!targetDoctor) {
    return NextResponse.json({ message: 'Doctor no encontrado.' }, { status: 400 });
  }

  if (user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor || doctor.id !== doctorId) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 403 });
    }
  }

  const sameDay = await prisma.booking.findMany({ where: { dateKey } });
  const hasRoomConflict = sameDay.some(b => b.roomId === roomId && b.status !== 'cancelled' && hasOverlap(startMin, endMin, b));
  const hasDoctorConflict = sameDay.some(b => b.doctorId === doctorId && b.status !== 'cancelled' && hasOverlap(startMin, endMin, b));

  if (hasRoomConflict || hasDoctorConflict) {
    return NextResponse.json(
      {
        message: hasDoctorConflict
          ? 'El médico ya tiene una reserva en otro consultorio a esta misma hora.'
          : 'El consultorio ya está ocupado en este horario.',
      },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      roomId,
      doctorId,
      dateKey,
      startMin,
      endMin,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      status: 'confirmed',
      createdBy: user.id,
    },
  });

  return NextResponse.json({ booking });
}
