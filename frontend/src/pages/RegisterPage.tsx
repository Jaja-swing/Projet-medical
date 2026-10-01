import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../api/types';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'PATIENT' as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register(form);
      navigate('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Inscription impossible');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="card">
      <h1>Creer un compte</h1>

      <form onSubmit={handleSubmit}>
        <label>
          Prenom
          <input
            value={form.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            required
          />
        </label>

        <label>
          Nom
          <input
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </label>

        <label>
          Mot de passe (8 caracteres minimum)
          <input
            type="password"
            minLength={8}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            required
          />
        </label>

        <label>
          Role
          <select value={form.role} onChange={(event) => updateField('role', event.target.value)}>
            <option value="PATIENT">Patient</option>
            <option value="MEDECIN">Medecin</option>
          </select>
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creation...' : "S'inscrire"}
        </button>
      </form>

      <p>
        Deja inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </main>
  );
}
