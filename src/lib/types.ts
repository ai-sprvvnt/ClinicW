export type BookingStatus =
  | 'reserved'
  | 'confirmed'
  | 'in_use'
  | 'done'
  | 'cancelled';

export type RoomStatus = 'Ocupado' | 'Apartado' | 'Desocupado';

export interface Room {
  id: string;
  name: string;
  roomType: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name?: string;
  displayName?: string;
  email?: string | null;
  blockedMinutes?: number;
  role?: string;
  canManageAdmins?: boolean;
  specialty: string;
  avatarUrl: string;
  staffType?: 'Profesional' | 'PracticasProfesionales' | 'ServicioSocial' | 'PersonalInterno';
  degree?: string | null;
  license?: string | null;
  career?: string | null;
  roleDescription?: string | null;
}

export interface Booking {
  id: string;
  clinicId?: string;
  roomId: string;
  doctorId: string | null;
  dateKey: string; // YYYY-MM-DD
  startAt: Date;
  endAt: Date;
  startMin: number; // minutes from midnight
  endMin: number; // minutes from midnight
  status: BookingStatus;
  notes?: string;
}

export interface RoomStatusInfo {
  status: RoomStatus;
  booking: Booking | null;
  doctor: Doctor | null;
  text: string;
}

export type AddBookingData = Omit<Booking, 'id' | 'status' | 'startAt' | 'endAt' | 'dateKey'> & {
    date: Date;
};

export interface AddBookingResult {
    success: boolean;
    suggestions?: { startMin: number; endMin: number }[];
    reason?: string;
    message?: string;
}
