// Comprobación rápida de la lógica pura: `npm run check` (Node 23.6+ ejecuta TypeScript directamente).
import assert from 'node:assert/strict';
import { addDays, isoDayIndex, lastDays, streak } from '../src/lib/dates.ts';
import { BASIC_FOODS, searchLocal } from '../src/lib/basic-foods.ts';
import { calcGoals, dailyGoals, recipePer100, scale, sumEntries, waterGoal } from '../src/lib/macros.ts';
import { pace, records } from '../src/lib/training.ts';
import { niceTicks, shortNumber } from '../src/lib/charts.ts';

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

// Recetas: 200 g de arroz (260 kcal) que pesan 400 g cocinados -> 65 kcal/100 g
assert.equal(recipePer100([{ grams: 200, food }]).kcal100, 130);
assert.equal(recipePer100([{ grams: 200, food }], 400).kcal100, 65);
assert.equal(recipePer100([]).kcal100, 0);

// Básicos: sin tildes, varias palabras, ids únicos, kcal coherentes con los macros (±25%, el resto es fibra/alcohol)
assert.equal(searchLocal('platano', [])[0].name, 'Plátano');
assert.ok(searchLocal('pollo pechuga', []).every((f) => f.name.includes('Pechuga de pollo')));
assert.equal(searchLocal('arroz', [{ ...food, name: 'Arroz con leche de mi abuela' }])[0].name, 'Arroz con leche de mi abuela');
assert.equal(new Set(BASIC_FOODS.map((f) => f.id)).size, BASIC_FOODS.length);
for (const f of BASIC_FOODS.filter((f) => !/Cerveza|Vino/.test(f.name))) {
  const est = f.protein100 * 4 + f.carbs100 * 4 + f.fat100 * 9;
  assert.ok(Math.abs(est - f.kcal100) <= f.kcal100 * 0.25 + 5, `${f.name}: ${f.kcal100} kcal vs ${est.toFixed(0)} por macros`);
}

// Entrenos
assert.equal(pace('carrera', 10, 50), '5:00 /km');
assert.equal(pace('carrera', 5, 27.5), '5:30 /km');
assert.equal(pace('natacion', 2, 40), '2:00 /100 m');
assert.equal(pace('bici', 60, 120), '30.0 km/h');
assert.equal(pace('carrera', 0, 30), null);
const ses = (date, sport, km, exercises = []) => ({ id: date, date, sport, minutes: 0, km, notes: '', exercises });
const r = records([
  ses('2026-10-01', 'fuerza', 0, [{ name: 'Sentadilla', sets: [{ reps: 5, kg: 100 }, { reps: 8, kg: 100 }] }]),
  ses('2026-10-02', 'fuerza', 0, [{ name: ' sentadilla ', sets: [{ reps: 10, kg: 90 }] }]),
  ses('2026-10-03', 'carrera', 10),
  ses('2026-10-04', 'carrera', 21.1),
  ses('2026-10-05', 'bici', 60),
]);
assert.deepEqual(r.lifts, [{ name: 'Sentadilla', kg: 100, reps: 8, date: '2026-10-01' }]);
assert.deepEqual(r.distance.find((d) => d.sport === 'carrera'), { sport: 'carrera', km: 21.1, date: '2026-10-04' });
assert.equal(r.distance.length, 2);

// Ejes de las gráficas
assert.deepEqual(niceTicks(0, 2587), [0, 1000, 2000, 3000]);
assert.deepEqual(niceTicks(70.4, 72.9, 3), [70, 71, 72, 73]);
assert.deepEqual(niceTicks(72, 72, 3), [71, 72, 73]);
assert.deepEqual(niceTicks(0, 3400), [0, 1000, 2000, 3000, 4000]);
assert.equal(shortNumber(2500), '2,5k');
assert.equal(shortNumber(3000), '3k');
assert.equal(shortNumber(72.5), '72,5');

console.log('ok');
