import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function NotFound() {
  const user = await getSessionUser();
  if (user) {
    redirect('/agenda');
  }
  redirect('/');
}
