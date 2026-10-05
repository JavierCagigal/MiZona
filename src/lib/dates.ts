export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** YYYY-MM-DD en hora local. */
export function dayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Los últimos n días acabando en `to`, del más antiguo al más reciente. */
export function lastDays(n: number, to = dayKey()) {
  return Array.from({ length: n }, (_, i) => addDays(to, i - n + 1));
}

/** 0 = lunes … 6 = domingo. */
export function isoDayIndex(d = new Date()) {
  return (d.getDay() + 6) % 7;
}

/** Días seguidos con registro. Si hoy aún no hay nada, la racha de ayer sigue viva. */
export function streak(has: (key: string) => boolean, today = dayKey()) {
  let k = has(today) ? today : addDays(today, -1);
  let n = 0;
  while (has(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}
