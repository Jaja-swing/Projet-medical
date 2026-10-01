export type Role = 'PATIENT' | 'MEDECIN' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/** Format d'erreur normalise renvoye par HttpExceptionFilter cote API. */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface Doctor {
  id: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  speciality: string;
  licenseNumber: string;
  bio: string | null;
}

export interface Availability {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: string;
  doctor: Doctor;
  patient: { id: string; firstName: string; lastName: string };
  availability: Availability | null;
  scheduledAt: string;
  status: AppointmentStatus;
  reason: string | null;
}
