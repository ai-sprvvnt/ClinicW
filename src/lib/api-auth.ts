import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  }
  return { user, response: null };
}

export async function requireAdmin() {
  const { user, response } = await requireUser();
  if (!user || response) {
    return { user: null, response: response || NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  }
  if (user.role !== 'ADMIN' && !user.isSuperAdmin) {
    return { user: null, response: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function requireSuperAdmin() {
  const { user, response } = await requireUser();
  if (!user || response) {
    return { user: null, response: response || NextResponse.json({ message: 'No autorizado' }, { status: 401 }) };
  }
  if (!user.isSuperAdmin) {
    return { user: null, response: NextResponse.json({ message: 'No autorizado' }, { status: 403 }) };
  }
  return { user, response: null };
}
