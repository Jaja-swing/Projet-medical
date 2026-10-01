import { request } from './client';
import type { Availability, Doctor } from './types';

export interface DoctorPayload {
  speciality: string;
  licenseNumber: string;
  bio?: string;
}

export const doctorsApi = {
  list: (): Promise<Doctor[]> => request<Doctor[]>('/doctors'),

  get: (id: string): Promise<Doctor> => request<Doctor>(`/doctors/${id}`),

  create: (payload: DoctorPayload): Promise<Doctor> =>
    request<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<DoctorPayload>): Promise<Doctor> =>
    request<Doctor>(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  remove: (id: string): Promise<void> => request<void>(`/doctors/${id}`, { method: 'DELETE' }),

  listAvailabilities: (doctorId: string): Promise<Availability[]> =>
    request<Availability[]>(`/doctors/${doctorId}/availabilities`),

  addAvailability: (doctorId: string, startTime: string, endTime: string): Promise<Availability> =>
    request<Availability>(`/doctors/${doctorId}/availabilities`, {
      method: 'POST',
      body: JSON.stringify({ startTime, endTime }),
    }),

  removeAvailability: (id: string): Promise<void> =>
    request<void>(`/availabilities/${id}`, { method: 'DELETE' }),
};
