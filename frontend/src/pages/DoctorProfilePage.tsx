import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { doctorsApi } from '../api/doctors';
import { useAuth } from '../context/AuthContext';
import { formatSlot, toIsoString } from '../format';
import type { Availability, Doctor } from '../api/types';

/** Ecran du medecin connecte : son profil et ses creneaux de disponibilite. */
export function DoctorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Availability[]>([]);
  const [form, setForm] = useState({ speciality: '', licenseNumber: '', bio: '' });
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // L'API ne fournit pas de route /doctors/me : le profil est retrouve dans la liste.
      const doctors = await doctorsApi.list();
      const own = doctors.find((doctor) => doctor.user.id === user?.id) ?? null;
      setProfile(own);

      if (own) {
        setForm({ speciality: own.speciality, licenseNumber: own.licenseNumber, bio: own.bio ?? '' });
        setSlots(await doctorsApi.listAvailabilities(own.id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    try {
      if (profile) {
        setProfile(await doctorsApi.update(profile.id, { ...form, bio: form.bio || undefined }));
        setNotice('Profil mis à jour.');
      } else {
        setProfile(await doctorsApi.create({ ...form, bio: form.bio || undefined }));
        setNotice('Profil créé.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement impossible');
    }
  }

  async function addSlot(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!profile) {
      return;
    }

    try {
      await doctorsApi.addAvailability(
        profile.id,
        toIsoString(slotForm.startTime),
        toIsoString(slotForm.endTime),
      );
      setSlotForm({ startTime: '', endTime: '' });
      setSlots(await doctorsApi.listAvailabilities(profile.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Créneau refusé');
    }
  }

  async function removeSlot(slotId: string) {
    setError(null);
    setNotice(null);

    try {
      await doctorsApi.removeAvailability(slotId);
      setSlots((previous) => previous.filter((slot) => slot.id !== slotId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Suppression impossible');
    }
  }

  if (loading) {
    return <p>Chargement…</p>;
  }

  return (
    <section>
      <h1>{profile ? 'Mon profil médecin' : 'Créer mon profil médecin'}</h1>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <form onSubmit={submitProfile}>
        <label>
          Spécialité
          <input
            value={form.speciality}
            onChange={(event) => setForm({ ...form, speciality: event.target.value })}
            required
          />
        </label>

        <label>
          Numéro de licence
          <input
            value={form.licenseNumber}
            onChange={(event) => setForm({ ...form, licenseNumber: event.target.value })}
            required
          />
        </label>

        <label>
          Présentation (optionnel)
          <textarea
            rows={3}
            value={form.bio}
            onChange={(event) => setForm({ ...form, bio: event.target.value })}
          />
        </label>

        <button type="submit">{profile ? 'Enregistrer' : 'Créer le profil'}</button>
      </form>

      {profile && (
        <>
          <h2>Mes créneaux</h2>

          <form onSubmit={addSlot}>
            <label>
              Début
              <input
                type="datetime-local"
                value={slotForm.startTime}
                onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })}
                required
              />
            </label>

            <label>
              Fin
              <input
                type="datetime-local"
                value={slotForm.endTime}
                onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })}
                required
              />
            </label>

            <button type="submit">Ajouter le créneau</button>
          </form>

          {slots.length === 0 && <p className="hint">Aucun créneau enregistré.</p>}

          <ul className="list">
            {slots.map((slot) => (
              <li key={slot.id}>
                <span>
                  {formatSlot(slot.startTime, slot.endTime)}
                  {slot.isBooked && <span className="badge badge-pending">Réservé</span>}
                </span>
                {!slot.isBooked && (
                  <button type="button" className="danger" onClick={() => void removeSlot(slot.id)}>
                    Supprimer
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
