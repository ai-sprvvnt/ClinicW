import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AgendaClient from './agenda-client';

export default async function AgendaPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin');
  }
  return <AgendaClient />;
}
