'use client';

import { useEffect, useRef, useState } from 'react';
import { useSessionUser } from '@/hooks/use-session-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const INACTIVITY_MINUTES = 240;
const WARNING_MINUTES = 5;

export function SessionTimeoutWarning() {
  const { user } = useSessionUser();
  const [open, setOpen] = useState(false);
  const warnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = () => {
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  };

  const scheduleTimers = () => {
    clearTimers();
    const now = Date.now();
    const warnAt = now + (INACTIVITY_MINUTES - WARNING_MINUTES) * 60 * 1000;
    const logoutAt = now + INACTIVITY_MINUTES * 60 * 1000;
    warnTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, Math.max(0, warnAt - now));
    logoutTimerRef.current = setTimeout(async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    }, Math.max(0, logoutAt - now));
  };

  const recordActivity = () => {
    lastActivityRef.current = Date.now();
    if (open) setOpen(false);
    scheduleTimers();
  };

  useEffect(() => {
    if (!user) return;
    recordActivity();

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => recordActivity();
    events.forEach((event) => window.addEventListener(event, handler, { passive: true }));
    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
      clearTimers();
    };
  }, [user]);

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tu sesión está por expirar</AlertDialogTitle>
          <AlertDialogDescription>
            Por inactividad, tu sesión se cerrará en {WARNING_MINUTES} minutos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>Cerrar</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await fetch('/api/auth/me', { credentials: 'include' });
              recordActivity();
            }}
          >
            Mantener sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
