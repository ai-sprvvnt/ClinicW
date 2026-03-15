import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isWithinInterval, format, getDay, getMinutes, getHours, set } from 'date-fns';
import type { Booking, Room, RoomStatusInfo, Doctor } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRoomStatus(room: Room, bookings: Booking[], doctors: Doctor[], now: Date): RoomStatusInfo {
  const todayKey = format(now, 'yyyy-MM-dd');
  const todayBookings = bookings
    .filter(b => b.dateKey === todayKey && !['cancelled', 'done'].includes(b.status))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const currentBooking = todayBookings.find(b =>
    isWithinInterval(now, { start: b.startAt, end: b.endAt }) && ['confirmed', 'in_use'].includes(b.status)
  );

  if (currentBooking) {
    const doctor = doctors.find(d => d.id === currentBooking.doctorId);
    return {
      status: 'Ocupado',
      booking: currentBooking,
      doctor: doctor,
      text: `En curso hasta ${format(currentBooking.endAt, 'HH:mm')}`,
    };
  }

  const nextBooking = todayBookings.find(b => b.startAt > now && ['reserved', 'confirmed'].includes(b.status));

  if (nextBooking) {
    const doctor = doctors.find(d => d.id === nextBooking.doctorId);
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

export function generateTimeSlots(date: Date, interval: number = 30): { value: number, label: string }[] {
  const slots = [];
  // Para el prototipo, permitimos citas de 8:00 AM a 8:00 PM todos los días
  const startHour = 8;
  const endHour = 20;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const totalMinutes = hour * 60 + minute;
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
