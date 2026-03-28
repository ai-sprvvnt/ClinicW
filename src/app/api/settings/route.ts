import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requireSuperAdmin } from '@/lib/api-auth';

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ settings: settings || { maxRooms: null, maxDoctors: null } });
}

export async function POST(req: Request) {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  const body = await req.json();
  const hasMaxRooms = Object.prototype.hasOwnProperty.call(body, 'maxRooms');
  const hasMaxDoctors = Object.prototype.hasOwnProperty.call(body, 'maxDoctors');
  const maxRooms = body.maxRooms;
  const maxDoctors = body.maxDoctors;

  if (!hasMaxRooms && !hasMaxDoctors) {
    return NextResponse.json({ message: 'Debe enviar al menos un limite para actualizar.' }, { status: 400 });
  }

  if (hasMaxRooms && maxRooms !== null && maxRooms !== undefined && (!Number.isInteger(maxRooms) || maxRooms < 1)) {
    return NextResponse.json({ message: 'El maximo de consultorios debe ser un entero mayor o igual a 1.' }, { status: 400 });
  }
  if (hasMaxDoctors && maxDoctors !== null && maxDoctors !== undefined && (!Number.isInteger(maxDoctors) || maxDoctors < 1)) {
    return NextResponse.json({ message: 'El maximo de medicos debe ser un entero mayor o igual a 1.' }, { status: 400 });
  }

  const updateData: { maxRooms?: number | null; maxDoctors?: number | null } = {};
  if (hasMaxRooms) updateData.maxRooms = maxRooms ?? null;
  if (hasMaxDoctors) updateData.maxDoctors = maxDoctors ?? null;

  const settings = await prisma.clinicSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      maxRooms: hasMaxRooms ? maxRooms ?? null : null,
      maxDoctors: hasMaxDoctors ? maxDoctors ?? null : null,
    },
    update: updateData,
  });

  return NextResponse.json({ settings });
}
