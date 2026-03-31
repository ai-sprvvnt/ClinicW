import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/api-auth';

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const doctor = await prisma.doctor.findUnique({
    where: { userId: user.id },
    include: { user: { select: { email: true } } },
  });
  if (!doctor) {
    return NextResponse.json({ doctor: null });
  }

  const { id, userId, displayName, specialty, avatarUrl } = doctor;
  return NextResponse.json({
    doctor: {
      id,
      userId,
      displayName,
      specialty,
      avatarUrl,
      email: doctor.user?.email || null,
    },
  });
}
