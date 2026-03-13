'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useIsAdmin() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user?.uid]);

  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);

  const isAdmin = !!adminDoc;
  const isLoading = isAuthLoading || isAdminDocLoading;

  return { isAdmin, isLoading, user };
}
