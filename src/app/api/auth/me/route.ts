import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const doctor =
    user.role === 'DOCTOR'
      ? await prisma.doctor.findUnique({ where: { userId: user.id } })
      : null;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      displayName: doctor?.displayName || null,
    },
  });
}
