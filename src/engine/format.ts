/** Helper di formattazione condivisi tra engine e UI (puri). */

/** Secondi -> "M:SS" (es. 600 -> "10:00", 65 -> "1:05"). */
export function formatTimer(secondsRemaining: number): string {
  const total = Math.max(0, Math.ceil(secondsRemaining));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Minuti dalla mezzanotte -> "HH:MM" (es. 1361 -> "22:41"). */
export function formatClock(clockMinutes: number): string {
  const normalized = ((clockMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
