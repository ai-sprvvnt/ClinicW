import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clearRateLimitForEmail } from '@/lib/login-rate-limit';

export async function POST(req: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email requerido.' }, { status: 400 });
    }
    clearRateLimitForEmail(email);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Error al desbloquear.' }, { status: 500 });
  }
}
