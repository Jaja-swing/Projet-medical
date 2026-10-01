import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { tokenStorage } from '../api/client';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth';
import type { AuthUser } from '../api/types';

const USER_KEY = 'auth_user';

interface AuthContextValue {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const persist = useCallback((accessToken: string, authUser: AuthUser) => {
    tokenStorage.set(accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const { accessToken, user: authUser } = await authApi.login(payload);
      persist(accessToken, authUser);
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const { accessToken, user: authUser } = await authApi.register(payload);
      persist(accessToken, authUser);
    },
    [persist],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
