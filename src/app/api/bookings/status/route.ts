import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/api-auth';

const VALID_BOOKING_STATUSES = ['reserved', 'confirmed', 'in_use', 'done', 'cancelled'] as const;
type BookingStatus = (typeof VALID_BOOKING_STATUSES)[number];

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { bookingId, status } = await req.json();
  if (!bookingId || !status) {
    return NextResponse.json({ message: 'Faltan campos requeridos.' }, { status: 400 });
  }
  if (!VALID_BOOKING_STATUSES.includes(status as BookingStatus)) {
    return NextResponse.json({ message: 'Estado de reserva inválido.' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ message: 'Reserva no encontrada.' }, { status: 404 });
  }

  if (user.role === 'DOCTOR') {
    const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
    if (!doctor || booking.doctorId !== doctor.id) {
      return NextResponse.json({ message: 'No autorizado.' }, { status: 403 });
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: status as BookingStatus,
      updatedBy: user.id,
    },
  });

  return NextResponse.json({ booking: updated });
}
