import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, requireAdmin } from '@/lib/api-auth';

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ rooms });
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ message: 'Nombre requerido.' }, { status: 400 });
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  if (settings?.maxRooms) {
    const count = await prisma.room.count();
    if (count >= settings.maxRooms) {
      return NextResponse.json(
        { message: `Límite de consultorios alcanzado (${settings.maxRooms}).` },
        { status: 409 }
      );
    }
  }

  const room = await prisma.room.create({ data: { name } });
  return NextResponse.json({ room });
}

export async function PUT(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, name } = await req.json();
  if (!id || !name) {
    return NextResponse.json({ message: 'ID y nombre requeridos.' }, { status: 400 });
  }

  const room = await prisma.room.update({ where: { id }, data: { name } });
  return NextResponse.json({ room });
}

export async function DELETE(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ message: 'ID requerido.' }, { status: 400 });
  }

  const activeBookings = await prisma.booking.count({
    where: { roomId: id, status: { not: 'cancelled' } },
  });

  if (activeBookings > 0) {
    return NextResponse.json({ message: 'El consultorio tiene reservas activas.' }, { status: 409 });
  }

  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
