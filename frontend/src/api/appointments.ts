import { request } from './client';
import type { Appointment } from './types';

export const appointmentsApi = {
  book: (availabilityId: string, reason?: string): Promise<Appointment> =>
    request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(reason ? { availabilityId, reason } : { availabilityId }),
    }),

  listMine: (): Promise<Appointment[]> => request<Appointment[]>('/appointments/me'),
  listDoctor: (): Promise<Appointment[]> => request<Appointment[]>('/appointments/DoctorAppointmentList'),  
  reschedule: (id: string, availabilityId: string): Promise<Appointment> =>
    request<Appointment>(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityId }),
    }),

  cancel: (id: string): Promise<Appointment> =>
    request<Appointment>(`/appointments/${id}/cancel`, { method: 'PATCH' }),
};
