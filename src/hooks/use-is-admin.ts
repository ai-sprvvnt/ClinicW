'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Hook para verificar si el usuario actual tiene privilegios de administrador.
 * Combina una verificación por correo electrónico (para el desarrollador principal)
 * y una verificación por base de datos (colección roles_admin).
 */
export function useIsAdmin() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user?.uid]);

  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRef);

  // Lista blanca de correos administrativos (fallback de emergencia)
  const ADMIN_EMAILS = ['ed.felipe.gn@gmail.com'];
  const isEmailAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  // Es admin si existe el documento en Firestore O si su correo está en la lista blanca
  const isAdmin = !!adminDoc || isEmailAdmin;
  const isLoading = isAuthLoading || isAdminDocLoading;

  return { isAdmin, isLoading, user };
}
