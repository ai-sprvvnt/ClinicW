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

  const { maxRooms, maxDoctors } = await req.json();
  if (maxRooms !== null && maxRooms !== undefined && (!Number.isInteger(maxRooms) || maxRooms < 1)) {
    return NextResponse.json({ message: 'El máximo de consultorios debe ser un entero mayor o igual a 1.' }, { status: 400 });
  }
  if (maxDoctors !== null && maxDoctors !== undefined && (!Number.isInteger(maxDoctors) || maxDoctors < 1)) {
    return NextResponse.json({ message: 'El máximo de médicos debe ser un entero mayor o igual a 1.' }, { status: 400 });
  }

  const settings = await prisma.clinicSettings.upsert({
    where: { id: 1 },
    create: { id: 1, maxRooms: maxRooms ?? null, maxDoctors: maxDoctors ?? null },
    update: { maxRooms: maxRooms ?? null, maxDoctors: maxDoctors ?? null },
  });

  return NextResponse.json({ settings });
}
