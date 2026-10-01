import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <nav>
          <NavLink to="/">Médecins</NavLink>
          <NavLink to="/appointments">Mes rendez-vous</NavLink>
          {user?.role === 'MEDECIN' && <NavLink to="/profile">Mon profil médecin</NavLink>}
        </nav>

        <div className="app-user">
          <span>
            {user?.firstName} {user?.lastName} · {user?.role}
          </span>
          <button type="button" className="link" onClick={logout}>
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
