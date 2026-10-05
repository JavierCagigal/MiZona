import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Field, Screen, Segmented, Sheet, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { addDays, dayKey, fromKey } from '@/lib/dates';
import { searchOpenFoodFacts } from '@/lib/food-api';
import { Entry, Food, MEALS, Meal, scale, sumEntries, uid } from '@/lib/macros';
import { useStored } from '@/lib/store';

type Editing = { food: Food; entry?: Entry };

function mealNow(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'Desayuno' : h < 16 ? 'Comida' : h < 20 ? 'Merienda' : 'Cena';
}

function dateLabel(key: string) {
  const today = dayKey();
  if (key === today) return 'Hoy';
  if (key === addDays(today, -1)) return 'Ayer';
  return fromKey(key).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Comidas() {
  const c = useColors();
  const [date, setDate] = useState(dayKey);
  const [entries, setEntries] = useStored<Entry[]>(`log:${date}`, []);
  const [custom, setCustom] = useStored<Food[]>('foods', []);
  const [recent, setRecent] = useStored<Food[]>('recent', []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ q: string; foods: Food[]; offline: boolean } | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [creating, setCreating] = useState(false);

  const q = query.trim();
  useEffect(() => {
    if (q.length < 2) return;
    let alive = true;
    const t = setTimeout(async () => {
      const own = custom.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
      const remote = await searchOpenFoodFacts(q);
      if (alive) setResults({ q, foods: [...own, ...(remote ?? [])], offline: remote === null });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, custom]);

  const searching = q.length >= 2;
  const fresh = results?.q === q ? results : null;

  const saveEntry = (food: Food, grams: number, meal: Meal, id?: string) => {
    const entry = { id: id ?? uid(), food, grams, meal };
    setEntries(id ? entries.map((e) => (e.id === id ? entry : e)) : [...entries, entry]);
    setRecent([food, ...recent.filter((f) => f.id !== food.id)].slice(0, 12));
    setEditing(null);
    setQuery('');
  };

  const totals = sumEntries(entries);

  return (
    <Screen>
      <View style={s.header}>
        <T v="title">Comidas</T>
        <View style={s.dateNav}>
          <Arrow label="‹" a11y="Día anterior" onPress={() => setDate(addDays(date, -1))} />
          <T v="label" style={s.dateText}>
            {dateLabel(date)}
          </T>
          <Arrow
            label="›"
            a11y="Día siguiente"
            onPress={() => setDate(addDays(date, 1))}
            disabled={date >= dayKey()}
          />
        </View>
      </View>

      <Card bg={c.food}>
        <Field
          label="Buscar alimento"
          value={query}
          onChangeText={setQuery}
          placeholder="ej. pechuga de pollo"
          autoCorrect={false}
          returnKeyType="search"
          style={{ backgroundColor: c.card }}
        />
        {searching ? (
          !fresh ? (
            <T v="label" dim>
              Buscando…
            </T>
          ) : fresh.foods.length === 0 ? (
            <T v="label" dim>
              {fresh.offline
                ? 'Sin conexión para buscar. Puedes crear el alimento tú.'
                : 'Sin resultados. Puedes crear el alimento tú.'}
            </T>
          ) : (
            fresh.foods.map((f) => <FoodRow key={f.id} food={f} onPress={() => setEditing({ food: f })} />)
          )
        ) : (
          recent.length > 0 && (
            <>
              <T v="label" dim>
                Recientes
              </T>
              {recent.map((f) => (
                <FoodRow key={f.id} food={f} onPress={() => setEditing({ food: f })} />
              ))}
            </>
          )
        )}
        <Button title="+ Crear alimento propio" kind="outline" onPress={() => setCreating(true)} />
      </Card>

      {entries.length === 0 ? (
        <T dim style={s.empty}>
          Nada registrado este día.
        </T>
      ) : (
        <>
          <T v="label" dim>
            {totals.calories} kcal · {totals.carbs}g carbos · {totals.fat}g grasa · {totals.protein}g prot
          </T>
          {MEALS.map((meal) => {
            const items = entries.filter((e) => e.meal === meal);
            if (items.length === 0) return null;
            return (
              <Card key={meal}>
                <T v="h">{meal}</T>
                {items.map((e) => (
                  <Pressable key={e.id} onPress={() => setEditing({ food: e.food, entry: e })} style={s.row}>
                    <T style={s.name} numberOfLines={2}>
                      {e.food.name} <T v="label" dim>{e.grams} g</T>
                    </T>
                    <T v="label">{scale(e.food, e.grams).calories} kcal</T>
                  </Pressable>
                ))}
              </Card>
            );
          })}
        </>
      )}

      {editing && (
        <QuantitySheet
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={(grams, meal) => saveEntry(editing.food, grams, meal, editing.entry?.id)}
          onDelete={() => {
            setEntries(entries.filter((e) => e.id !== editing.entry?.id));
            setEditing(null);
          }}
        />
      )}
      {creating && (
        <CustomFoodSheet
          onClose={() => setCreating(false)}
          onSave={(food) => {
            setCustom([food, ...custom]);
            setCreating(false);
            setEditing({ food });
          }}
        />
      )}
    </Screen>
  );
}

function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}>
      <T style={s.name} numberOfLines={2}>
        {food.name}
        {food.source === 'custom' && <T v="label" dim>{'  '}propio</T>}
      </T>
      <T v="label" dim>
        {food.kcal100} kcal/100g
      </T>
    </Pressable>
  );
}

function Arrow({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={a11y}
      hitSlop={10}
      style={{ opacity: disabled ? 0.25 : 1 }}>
      <T v="h">{label}</T>
    </Pressable>
  );
}

function QuantitySheet({
  editing,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing;
  onClose: () => void;
  onSave: (grams: number, meal: Meal) => void;
  onDelete: () => void;
}) {
  const [grams, setGrams] = useState(String(editing.entry?.grams ?? 100));
  const [meal, setMeal] = useState<Meal>(editing.entry?.meal ?? mealNow());
  const g = parseFloat(grams.replace(',', '.')) || 0;
  const m = scale(editing.food, g);

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">{editing.food.name}</T>
      <Field label="Cantidad (g)" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" selectTextOnFocus />
      <Segmented options={MEALS.map((x) => ({ id: x, label: x }))} value={meal} onChange={setMeal} />
      <T v="label" dim>
        {m.calories} kcal · {m.carbs}g carbos · {m.fat}g grasa · {m.protein}g prot
      </T>
      <Button title={editing.entry ? 'Guardar cambios' : 'Añadir'} onPress={() => {
          if (g > 0) onSave(g, meal);
        }} />
      {editing.entry && <Button title="Eliminar" kind="danger" onPress={onDelete} />}
    </Sheet>
  );
}

function CustomFoodSheet({ onClose, onSave }: { onClose: () => void; onSave: (food: Food) => void }) {
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState('');
  const c = useColors();
  const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm({ ...form, [key]: v }),
  });

  const save = () => {
    if (!form.name.trim() || !num(form.kcal)) {
      setError('Pon al menos el nombre y las calorías.');
      return;
    }
    onSave({
      id: uid(),
      source: 'custom',
      name: form.name.trim(),
      kcal100: num(form.kcal),
      protein100: num(form.protein),
      carbs100: num(form.carbs),
      fat100: num(form.fat),
    });
  };

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">Alimento propio</T>
      <Field label="Nombre" placeholder="Batido de proteína" {...field('name')} />
      <View style={s.grid}>
        <View style={s.cell}>
          <Field label="Kcal / 100 g" keyboardType="decimal-pad" {...field('kcal')} />
        </View>
        <View style={s.cell}>
          <Field label="Proteína / 100 g" keyboardType="decimal-pad" {...field('protein')} />
        </View>
        <View style={s.cell}>
          <Field label="Carbos / 100 g" keyboardType="decimal-pad" {...field('carbs')} />
        </View>
        <View style={s.cell}>
          <Field label="Grasa / 100 g" keyboardType="decimal-pad" {...field('fat')} />
        </View>
      </View>
      {error ? (
        <T v="label" style={{ color: c.danger }}>
          {error}
        </T>
      ) : null}
      <Button title="Guardar y añadir" onPress={save} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontFamily: Font.bold, minWidth: 70, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 },
  name: { flex: 1, fontSize: 14 },
  empty: { textAlign: 'center', paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexGrow: 1, flexBasis: '45%' },
});
