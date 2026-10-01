import type { ApiErrorBody } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'access_token';

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

/** Appel HTTP unique de l'application : ajoute le JWT et normalise les erreurs. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = body as ApiErrorBody | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(', ')
      : (error?.message ?? 'Une erreur est survenue');
    throw new ApiError(response.status, message);
  }

  return body as T;
}
