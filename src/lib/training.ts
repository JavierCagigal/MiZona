export const SPORTS = [
  { id: 'fuerza', label: 'Fuerza' },
  { id: 'carrera', label: 'Carrera' },
  { id: 'bici', label: 'Bici' },
  { id: 'natacion', label: 'Natación' },
  { id: 'otro', label: 'Otro' },
] as const;

export type Sport = (typeof SPORTS)[number]['id'];
export type WorkSet = { reps: number; kg: number };
export type Exercise = { name: string; sets: WorkSet[] };
export type Session = {
  id: string;
  date: string;
  sport: Sport;
  minutes: number;
  km: number;
  notes: string;
  exercises: Exercise[];
};

export function sportLabel(id: Sport) {
  return SPORTS.find((s) => s.id === id)?.label ?? id;
}

/** Ritmo en el formato que usa cada deporte: min/km, km/h o min/100 m. */
export function pace(sport: Sport, km: number, minutes: number) {
  if (!(km > 0 && minutes > 0)) return null;
  const mmss = (min: number) => `${Math.floor(min)}:${String(Math.round((min % 1) * 60)).padStart(2, '0')}`;
  if (sport === 'carrera') return `${mmss(minutes / km)} /km`;
  if (sport === 'natacion') return `${mmss(minutes / (km * 10))} /100 m`;
  return `${((km / minutes) * 60).toFixed(1)} km/h`;
}

export function summary(s: Session) {
  if (s.sport === 'fuerza') {
    const sets = s.exercises.reduce((n, e) => n + e.sets.length, 0);
    const n = s.exercises.length;
    const parts = [`${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`, `${sets} ${sets === 1 ? 'serie' : 'series'}`];
    if (s.minutes) parts.push(`${s.minutes} min`);
    return parts.join(' · ');
  }
  return [s.km && `${s.km} km`, s.minutes && `${s.minutes} min`, pace(s.sport, s.km, s.minutes)]
    .filter(Boolean)
    .join(' · ');
}

/** Mejor serie por ejercicio (más kilos; a igualdad, más repeticiones) y distancia más larga por deporte. */
export function records(sessions: Session[]) {
  const lifts = new Map<string, { name: string; kg: number; reps: number; date: string }>();
  const distance = new Map<Sport, { km: number; date: string }>();

  for (const s of sessions) {
    for (const e of s.exercises) {
      const key = e.name.trim().toLowerCase();
      if (!key) continue;
      for (const set of e.sets) {
        if (!(set.kg > 0)) continue;
        const best = lifts.get(key);
        if (!best || set.kg > best.kg || (set.kg === best.kg && set.reps > best.reps)) {
          lifts.set(key, { name: e.name.trim(), kg: set.kg, reps: set.reps, date: s.date });
        }
      }
    }
    if (s.sport !== 'fuerza' && s.km > 0) {
      const best = distance.get(s.sport);
      if (!best || s.km > best.km) distance.set(s.sport, { km: s.km, date: s.date });
    }
  }

  return {
    lifts: [...lifts.values()].sort((a, b) => b.kg - a.kg),
    distance: [...distance.entries()].map(([sport, v]) => ({ sport, ...v })),
  };
}
