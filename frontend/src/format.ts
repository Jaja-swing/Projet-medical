const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { timeStyle: 'short' });

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** « lundi 26 septembre 2026 à 09:00 — 10:00 » */
export function formatSlot(startTime: string, endTime: string): string {
  return `${dateTimeFormatter.format(new Date(startTime))} — ${timeFormatter.format(new Date(endTime))}`;
}

/** Valeur d'un <input type="datetime-local"> vers un ISO 8601 UTC. */
export function toIsoString(localValue: string): string {
  return new Date(localValue).toISOString();
}
