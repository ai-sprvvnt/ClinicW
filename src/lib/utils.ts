import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isWithinInterval, format, set, isSameDay, getHours, getMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Booking, Room, RoomStatusInfo, Doctor } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRoomStatus(room: Room, bookings: Booking[], doctors: Doctor[], now: Date): RoomStatusInfo {
  const todayKey = format(now, 'yyyy-MM-dd');
  const todayBookings = bookings
    .filter(b => 
      b.dateKey === todayKey && 
      !['cancelled', 'done'].includes(b.status) &&
      b.endAt > now
    )
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const currentBooking = todayBookings.find(b =>
    isWithinInterval(now, { start: b.startAt, end: b.endAt }) && ['confirmed', 'in_use'].includes(b.status)
  );

  if (currentBooking) {
    const doctor = currentBooking.doctorId ? (doctors.find(d => d.id === currentBooking.doctorId) || null) : null;
    return {
      status: 'Ocupado',
      booking: currentBooking,
      doctor: doctor,
      text: `En curso hasta ${format(currentBooking.endAt, 'HH:mm')}`,
    };
  }

  const nextBooking = todayBookings.find(b => b.startAt > now && ['reserved', 'confirmed'].includes(b.status));

  if (nextBooking) {
    const doctor = nextBooking.doctorId ? (doctors.find(d => d.id === nextBooking.doctorId) || null) : null;
    return {
      status: 'Apartado',
      booking: nextBooking,
      doctor: doctor,
      text: `Próximo ${format(nextBooking.startAt, 'HH:mm')} - ${format(nextBooking.endAt, 'HH:mm')}`,
    };
  }

  return {
    status: 'Desocupado',
    booking: null,
    doctor: null,
    text: 'Libre todo el día',
  };
}

/**
 * Genera slots de tiempo para un día específico.
 * Si se proporciona `now` y el día es hoy, filtra las horas pasadas.
 */
export function generateTimeSlots(date: Date, interval: number = 30, now?: Date): { value: number, label: string }[] {
  const slots = [];
  const startHour = 8;
  const endHour = 20;

  const isToday = now ? isSameDay(date, now) : false;
  const currentTotalMinutes = now ? getHours(now) * 60 + getMinutes(now) : 0;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const totalMinutes = hour * 60 + minute;
      
      // Si es hoy, solo incluir slots que sean en el futuro
      if (isToday && totalMinutes <= currentTotalMinutes) {
        continue;
      }

      const time = set(date, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
      slots.push({
        value: totalMinutes,
        label: format(time, 'HH:mm'),
      });
    }
  }
  return slots;
}

export function checkOverlap(newBooking: { startMin: number, endMin: number }, existingBookings: Booking[]): boolean {
  for (const existing of existingBookings) {
    if (newBooking.startMin < existing.endMin && newBooking.endMin > existing.startMin) {
      return true; // Overlap detected
    }
  }
  return false;
}

export const formatMinutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Genera y descarga un archivo CSV a partir de un array de objetos.
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar comas y comillas
        const stringValue = value === null || value === undefined ? '' : String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const baseName = typeof filename === "string" ? filename.trim() : "";
  const safeBaseName = baseName.length > 0 ? baseName : "reporte.csv";
  const withExtension = safeBaseName.toLowerCase().endsWith(".csv")
    ? safeBaseName
    : `${safeBaseName}.csv`;
  const sanitizedName = withExtension.replace(/[\\/:*?"<>|]+/g, "_");
  const contentWithBom = "\uFEFF" + csvContent;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/export-csv';
  form.enctype = 'multipart/form-data';
  form.style.display = 'none';

  const contentInput = document.createElement('input');
  contentInput.type = 'hidden';
  contentInput.name = 'content';
  contentInput.value = contentWithBom;
  form.appendChild(contentInput);

  const filenameInput = document.createElement('input');
  filenameInput.type = 'hidden';
  filenameInput.name = 'filename';
  filenameInput.value = sanitizedName;
  form.appendChild(filenameInput);

  document.body.appendChild(form);
  form.submit();

  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
}

export { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format };
