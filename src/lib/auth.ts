import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

const SESSION_DAYS = 1;
const INACTIVITY_MINUTES = 240;

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const lastActiveAt = new Date(now);
  await prisma.session.create({
    data: { token, userId, expiresAt, lastActiveAt },
  });
  return { token, expiresAt };
}

export async function clearSessionToken(token: string | undefined) {
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
}

export async function getSessionUser() {
  const { cookies } = await import('next/headers');
  const SESSION_COOKIE = 'clinic_session';
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt < now) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  if (session.lastActiveAt && new Date(session.lastActiveAt.getTime() + INACTIVITY_MINUTES * 60 * 1000) < now) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  await prisma.session.update({
    where: { token },
    data: { lastActiveAt: now },
  });
  return session.user;
}
