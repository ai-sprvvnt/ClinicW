import { NextResponse } from 'next/server';
import { clearSessionToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('clinic_session')?.value;
  await clearSessionToken(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set('clinic_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return res;
}
