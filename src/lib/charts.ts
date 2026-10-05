/** Marcas "redondas" del eje (pasos de 1, 2, 2,5 o 5 × 10ⁿ) que cubren [min, max]. */
export function niceTicks(min: number, max: number, count = 4) {
  if (!(max > min)) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((x) => x >= raw - 1e-9)!;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let i = 0; lo + i * step <= hi + step / 2; i++) ticks.push(Math.round((lo + i * step) * 1e6) / 1e6);
  return ticks;
}

/** 2500 → "2,5k", 3000 → "3k", 72.5 → "72,5". */
export function shortNumber(n: number) {
  if (Math.abs(n) >= 1000) return `${+(n / 1000).toFixed(1)}k`.replace('.', ',');
  return String(+n.toFixed(1)).replace('.', ',');
}
