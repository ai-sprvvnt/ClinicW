import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, verifyPassword } from '@/lib/auth';
import {
  registerFailure,
  clearRateLimit,
  getBlockedMinutesForKey,
} from '@/lib/login-rate-limit';

function getClientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Faltan credenciales.' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const ipKey = `ip:${ip}`;
    const emailKey = `email:${email.toLowerCase()}`;
    const blockedMinutes = Math.max(
      getBlockedMinutesForKey(ipKey),
      getBlockedMinutesForKey(emailKey)
    );
    if (blockedMinutes > 0) {
      const minutesLeft = Math.max(registerFailure(ipKey), registerFailure(emailKey));
      return NextResponse.json(
        { success: false, message: `Estás bloqueado por intentos fallidos. Espera ${minutesLeft} minuto(s).` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const minutesLeft = Math.max(registerFailure(ipKey), registerFailure(emailKey));
      if (minutesLeft > 0) {
        return NextResponse.json(
          { success: false, message: `Estás bloqueado por intentos fallidos. Espera ${minutesLeft} minuto(s).` },
          { status: 429 }
        );
      }
      return NextResponse.json({ success: false, message: 'Credenciales inválidas.' }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const minutesLeft = Math.max(registerFailure(ipKey), registerFailure(emailKey));
      if (minutesLeft > 0) {
        return NextResponse.json(
          { success: false, message: `Estás bloqueado por intentos fallidos. Espera ${minutesLeft} minuto(s).` },
          { status: 429 }
        );
      }
      return NextResponse.json({ success: false, message: 'Credenciales inválidas.' }, { status: 401 });
    }

    clearRateLimit(ipKey);
    clearRateLimit(emailKey);

    const { token, expiresAt } = await createSessionToken(user.id);
    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set('clinic_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });
    return res;
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error al iniciar sesión.' }, { status: 500 });
  }
}
