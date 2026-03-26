import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Faltan credenciales.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas.' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Credenciales inválidas.' }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionToken(user.id);
    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set('clinic_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
    return res;
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al iniciar sesión.' }, { status: 500 });
  }
}
