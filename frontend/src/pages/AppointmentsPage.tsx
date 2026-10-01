import { useCallback, useEffect, useState } from "react";
import { appointmentsApi } from "../api/appointments";
import { doctorsApi } from "../api/doctors";
import { StatusBadge } from "../components/StatusBadge";
import { formatDateTime, formatSlot } from "../format";
import type { Appointment, Availability } from "../api/types";
import { useAuth } from "../context/AuthContext";

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [freeSlots, setFreeSlots] = useState<Availability[]>([]);

  const { user } = useAuth();
  console.log(user);
  const load = useCallback(async () => {
    setError(null);

    try {
      if (user?.role == "PATIENT") {
        setAppointments(await appointmentsApi.listMine());
      } else if (user?.role == "MEDECIN") {
        setAppointments(await appointmentsApi.listDoctor());
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Chargement impossible",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel(id: string) {
    setError(null);

    try {
      await appointmentsApi.cancel(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Annulation impossible",
      );
    }
  }

  async function openReschedule(appointment: Appointment) {
    setError(null);
    setReschedulingId(appointment.id);

    try {
      const slots = await doctorsApi.listAvailabilities(appointment.doctor.id);
      setFreeSlots(slots.filter((slot) => !slot.isBooked));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Créneaux indisponibles",
      );
    }
  }

  async function reschedule(id: string, availabilityId: string) {
    setError(null);

    try {
      await appointmentsApi.reschedule(id, availabilityId);
      setReschedulingId(null);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Reprogrammation impossible",
      );
    }
  }

  if (loading) {
    return <p>Chargement…</p>;
  }

  return (
    <section>
      <h1>Mes rendez-vous</h1>

      {error && <p className="error">{error}</p>}
      {appointments.length === 0 && (
        <p className="hint">Aucun rendez-vous pour le moment.</p>
      )}

      <ul className="list list-column">
        {appointments.map((appointment) => {
          const isActive =
            appointment.status === "PENDING" ||
            appointment.status === "CONFIRMED";

          let firstName: string = "";
          let lastName: string = "";

          switch (user?.role) {
            case "ADMIN":
              break;
            case "MEDECIN":
              firstName = appointment.patient.firstName;
              lastName = appointment.patient.lastName;
              break;
            case "PATIENT":
              firstName = appointment.doctor.user.firstName;
              lastName = appointment.doctor.user.lastName;
              break;
            default:
              break;
          }
          return (
            <li key={appointment.id}>
              <div className="row">
                <div>
                  <strong>
                    {firstName} {lastName}
                  </strong>
                  <p className="hint">
                    {user?.role === "PATIENT"
                      ? appointment.doctor.speciality + " · "
                      : " "}
                    {formatDateTime(appointment.scheduledAt)}
                  </p>
                  {appointment.reason && (
                    <p className="hint">Motif : {appointment.reason}</p>
                  )}
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              {isActive && (
                <div className="actions">
                  <button
                    type="button"
                    onClick={() => void openReschedule(appointment)}
                  >
                    Reprogrammer
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void cancel(appointment.id)}
                  >
                    Annuler
                  </button>
                </div>
              )}

              {reschedulingId === appointment.id && (
                <div className="reschedule">
                  {freeSlots.length === 0 ? (
                    <p className="hint">
                      Aucun autre créneau disponible chez ce médecin.
                    </p>
                  ) : (
                    <ul className="list">
                      {freeSlots.map((slot) => (
                        <li key={slot.id}>
                          <span>
                            {formatSlot(slot.startTime, slot.endTime)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void reschedule(appointment.id, slot.id)
                            }
                          >
                            Choisir
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="link"
                    onClick={() => setReschedulingId(null)}
                  >
                    Fermer
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
