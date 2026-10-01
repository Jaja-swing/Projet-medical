import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doctorsApi } from '../api/doctors';
import type { Doctor } from '../api/types';

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorsApi
      .list()
      .then(setDoctors)
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : 'Chargement impossible'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Chargement…</p>;
  }

  return (
    <section>
      <h1>Médecins</h1>

      {error && <p className="error">{error}</p>}
      {!error && doctors.length === 0 && <p className="hint">Aucun médecin enregistré.</p>}

      <ul className="list">
        {doctors.map((doctor) => (
          <li key={doctor.id}>
            <div>
              <strong>
                Dr {doctor.user.firstName} {doctor.user.lastName}
              </strong>
              <p className="hint">{doctor.speciality}</p>
            </div>
            <Link className="button" to={`/doctors/${doctor.id}`}>
              Voir les créneaux
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
