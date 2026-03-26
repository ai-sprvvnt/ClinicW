import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';

export async function GET() {
  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    clinicName: settings?.clinicName || null,
    logoUrl: settings?.logoUrl || null,
  });
}

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { clinicName, logoUrl } = await req.json();

  const name =
    typeof clinicName === 'string' && clinicName.trim().length > 0
      ? clinicName.trim()
      : null;
  const logo =
    typeof logoUrl === 'string' && logoUrl.trim().length > 0
      ? logoUrl.trim()
      : null;

  const settings = await prisma.clinicSettings.upsert({
    where: { id: 1 },
    create: { id: 1, clinicName: name, logoUrl: logo },
    update: { clinicName: name, logoUrl: logo },
  });

  return NextResponse.json({
    clinicName: settings.clinicName || null,
    logoUrl: settings.logoUrl || null,
  });
}
