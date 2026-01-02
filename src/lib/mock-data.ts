import { addHours, format, set, startOfToday } from 'date-fns';
import type { Room, Doctor, Booking } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const ROOMS: Room[] = [
  { id: 'room-1', name: 'Consultorio 1' },
  { id: 'room-2', name: 'Consultorio 2' },
  { id: 'room-3', name: 'Consultorio 3' },
  { id: 'room-4', name: 'Consultorio 4' },
];

export const DOCTORS: Doctor[] = PlaceHolderImages.map((img, index) => ({
  id: `doc-${index + 1}`,
  name: [
    'Dra. Elena Vasquez',
    'Dr. Carlos Rivera',
    'Dra. Sofia Garcia',
    'Dr. Mateo Hernandez',
    'Dra. Valentina Torres',
    'Dr. Diego Martinez',
    'Dra. Camila Diaz',
    'Dr. Santiago Flores',
    'Dra. Isabella Morales',
    'Dr. Leonardo Cruz',
  ][index],
  specialty: ['Cardiología', 'Pediatría', 'Dermatología', 'General', 'Ginecología', 'Neurología', 'Oftalmología', 'Psiquiatría', 'Endocrinología', 'Ortopedia'][index],
  avatarUrl: img.imageUrl,
}));

// --- Generate dynamic mock bookings for today ---
const today = startOfToday();
const todayKey = format(today, 'yyyy-MM-dd');

const createBooking = (
  id: number,
  roomId: string,
  doctorId: string,
  startHour: number,
  endHour: number,
  status: 'confirmed' | 'in_use' | 'reserved'
): Booking => {
  const startAt = set(today, { hours: startHour, minutes: 0, seconds: 0, milliseconds: 0 });
  const endAt = set(today, { hours: endHour, minutes: 0, seconds: 0, milliseconds: 0 });
  return {
    id: `booking-${id}`,
    roomId,
    doctorId,
    dateKey: todayKey,
    startAt,
    endAt,
    startMin: startHour * 60,
    endMin: endHour * 60,
    status,
  };
};

export const initialBookings: Booking[] = [
  // Room 1: Currently in use
  createBooking(1, 'room-1', 'doc-1', new Date().getHours(), new Date().getHours() + 1, 'in_use'),
  // Room 1: Reserved for later
  createBooking(2, 'room-1', 'doc-2', new Date().getHours() + 2, new Date().getHours() + 3, 'reserved'),

  // Room 2: Reserved for later today
  createBooking(3, 'room-2', 'doc-3', new Date().getHours() + 1, new Date().getHours() + 2, 'reserved'),

  // Room 3: Confirmed, but in the past (for demonstration)
  createBooking(4, 'room-3', 'doc-4', 8, 9, 'confirmed'),
  
  // Room 4 is free
];
