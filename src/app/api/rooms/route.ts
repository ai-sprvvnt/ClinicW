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

  const { name, roomType } = await req.json();
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedType = typeof roomType === 'string' ? roomType.trim() : '';
  if (!trimmedName || !trimmedType) {
    return NextResponse.json({ message: 'Nombre y tipo de consultorio son requeridos.' }, { status: 400 });
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

  const room = await prisma.room.create({ data: { name: trimmedName, roomType: trimmedType } });
  return NextResponse.json({ room });
}

export async function PUT(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, name, roomType } = await req.json();
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedType = typeof roomType === 'string' ? roomType.trim() : '';
  if (!id || !trimmedName || !trimmedType) {
    return NextResponse.json({ message: 'ID, nombre y tipo de consultorio son requeridos.' }, { status: 400 });
  }

  const room = await prisma.room.update({ where: { id }, data: { name: trimmedName, roomType: trimmedType } });
  return NextResponse.json({ room });
}

export async function DELETE(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ message: 'ID requerido.' }, { status: 400 });
  }

  const now = new Date();
  const activeBookings = await prisma.booking.count({
    where: {
      roomId: id,
      status: { in: ['reserved', 'confirmed', 'in_use'] },
      endAt: { gt: now },
    },
  });

  if (activeBookings > 0) {
    return NextResponse.json({ message: 'El consultorio tiene reservas activas.' }, { status: 409 });
  }

  try {
    await prisma.$transaction([
      prisma.booking.deleteMany({ where: { roomId: id } }),
      prisma.room.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ message: 'Consultorio no encontrado.' }, { status: 404 });
    }
    if (error?.code === 'P2003') {
      return NextResponse.json({ message: 'No se pudo eliminar por dependencias relacionadas.' }, { status: 409 });
    }
    throw error;
  }
}
