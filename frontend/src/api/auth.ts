import { request } from './client';
import type { AuthResponse, Role } from './types';

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: LoginPayload): Promise<AuthResponse> =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
};
