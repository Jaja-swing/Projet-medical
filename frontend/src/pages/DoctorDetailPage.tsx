import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doctorsApi } from '../api/doctors';
import { appointmentsApi } from '../api/appointments';
import { useAuth } from '../context/AuthContext';
import { formatSlot } from '../format';
import type { Availability, Doctor } from '../api/types';

export function DoctorDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    try {
      const [loadedDoctor, loadedSlots] = await Promise.all([
        doctorsApi.get(id),
        doctorsApi.listAvailabilities(id),
      ]);
      setDoctor(loadedDoctor);
      setSlots(loadedSlots);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chargement impossible');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function book(availabilityId: string) {
    setError(null);
    setPendingSlotId(availabilityId);

    try {
      await appointmentsApi.book(availabilityId, reason.trim() || undefined);
      navigate('/appointments');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Réservation impossible');
      await load();
    } finally {
      setPendingSlotId(null);
    }
  }

  if (!doctor) {
    return error ? <p className="error">{error}</p> : <p>Chargement…</p>;
  }

  const freeSlots = slots.filter((slot) => !slot.isBooked);

  return (
    <section>
      <h1>
        Dr {doctor.user.firstName} {doctor.user.lastName}
      </h1>
      <p className="hint">{doctor.speciality}</p>
      {doctor.bio && <p>{doctor.bio}</p>}

      <h2>Créneaux disponibles</h2>

      {error && <p className="error">{error}</p>}
      {freeSlots.length === 0 && <p className="hint">Aucun créneau disponible pour le moment.</p>}

      {user?.role === 'PATIENT' && freeSlots.length > 0 && (
        <label>
          Motif de la consultation (optionnel)
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
      )}

      <ul className="list">
        {freeSlots.map((slot) => (
          <li key={slot.id}>
            <span>{formatSlot(slot.startTime, slot.endTime)}</span>
            {user?.role === 'PATIENT' && (
              <button
                type="button"
                disabled={pendingSlotId === slot.id}
                onClick={() => void book(slot.id)}
              >
                {pendingSlotId === slot.id ? 'Réservation…' : 'Réserver'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
