// Comprobación rápida de la lógica pura: `npm run check` (Node 23.6+ ejecuta TypeScript directamente).
import assert from 'node:assert/strict';
import { addDays, isoDayIndex, lastDays, streak } from '../src/lib/dates.ts';
import { calcGoals, dailyGoals, scale, sumEntries, waterGoal } from '../src/lib/macros.ts';

const p = { weight: 75, height: 178, age: 28, sex: 'hombre', activity: 'moderado', goalType: 'mantener', overrides: null };
const g = calcGoals(p);
assert.equal(g.bmr, 1728); // 750 + 1112.5 - 140 + 5 = 1727.5
assert.equal(g.tdee, 2678); // 1727.5 * 1.55
assert.equal(g.protein, 135);
assert.equal(dailyGoals({ ...p, overrides: { calories: 2500 } }).calories, 2500);
assert.equal(dailyGoals({ ...p, overrides: { calories: 2500 } }).protein, 135);

const food = { id: 'x', source: 'custom', name: 'Arroz', kcal100: 130, protein100: 2.7, carbs100: 28, fat100: 0.3 };
assert.deepEqual(scale(food, 200), { calories: 260, protein: 5, carbs: 56, fat: 1 });
assert.equal(sumEntries([{ id: 'a', meal: 'Comida', grams: 200, food }, { id: 'b', meal: 'Cena', grams: 100, food }]).calories, 390);
assert.equal(waterGoal(75), 2750);
assert.equal(waterGoal(), 2000);

assert.equal(addDays('2026-03-01', -1), '2026-02-28');
assert.equal(addDays('2026-12-31', 1), '2027-01-01');
assert.deepEqual(lastDays(3, '2026-01-02'), ['2025-12-31', '2026-01-01', '2026-01-02']);
assert.equal(isoDayIndex(new Date(2026, 9, 5)), 0); // lunes
assert.equal(isoDayIndex(new Date(2026, 9, 11)), 6); // domingo

const days = new Set(['2026-10-03', '2026-10-04']);
assert.equal(streak((k) => days.has(k), '2026-10-05'), 2); // hoy vacío: cuenta desde ayer
assert.equal(streak((k) => days.has(k), '2026-10-04'), 2);
assert.equal(streak(() => false, '2026-10-05'), 0);

console.log('ok');
