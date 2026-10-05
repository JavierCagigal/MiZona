import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarcodeSheet } from '@/components/barcode-sheet';
import { FoodResults, FoodRow, useFoodSearch } from '@/components/food-search';
import { RecipeSheet } from '@/components/recipe-sheet';
import { Button, Card, Field, Input, Screen, Segmented, Sheet, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { addDays, dayKey, fromKey } from '@/lib/dates';
import { Entry, Food, MEALS, Meal, scale, sumEntries, uid } from '@/lib/macros';
import { load, save, useStored } from '@/lib/store';

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

/** Copia registros con ids nuevos al final del día indicado (leyendo lo que ya haya guardado). */
async function appendTo(day: string, entries: Entry[]) {
  const current = await load<Entry[]>(`log:${day}`, []);
  const copies = entries.map((e) => ({ ...e, id: uid() }));
  save(`log:${day}`, [...current, ...copies]);
  return [...current, ...copies];
}

export default function Comidas() {
  const c = useColors();
  const today = dayKey();
  const [date, setDate] = useState(dayKey);
  const [entries, setEntries] = useStored<Entry[]>(`log:${date}`, []);
  const [own, setOwn] = useStored<Food[]>('foods', []);
  const [recent, setRecent] = useStored<Food[]>('recent', []);
  const [favs, setFavs] = useStored<Food[]>('favs', []);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Editing | null>(null);
  const [sheet, setSheet] = useState<'custom' | 'recipe' | 'barcode' | null>(null);
  const [notice, setNotice] = useState('');
  const search = useFoodSearch(query, own);

  const flash = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(''), 2500);
  };

  const saveEntry = (food: Food, grams: number, meal: Meal, id?: string) => {
    const entry = { id: id ?? uid(), food, grams, meal };
    setEntries(id ? entries.map((e) => (e.id === id ? entry : e)) : [...entries, entry]);
    setRecent([food, ...recent.filter((f) => f.id !== food.id)].slice(0, 12));
    setEditing(null);
    setQuery('');
  };

  const toggleFav = (food: Food) =>
    setFavs(favs.some((f) => f.id === food.id) ? favs.filter((f) => f.id !== food.id) : [food, ...favs]);

  const copyPreviousDay = async () => {
    const prev = await load<Entry[]>(`log:${addDays(date, -1)}`, []);
    if (prev.length === 0) return flash('El día anterior está vacío.');
    setEntries(await appendTo(date, prev));
  };

  const copyMealToToday = async (meal: Meal, items: Entry[]) => {
    await appendTo(today, items);
    flash(`${meal} copiada a hoy.`);
  };

  const totals = sumEntries(entries);
  const recentOnly = recent.filter((r) => !favs.some((f) => f.id === r.id));

  return (
    <Screen>
      <View style={s.header}>
        <T v="title">Comidas</T>
        <View style={s.dateNav}>
          <Arrow label="‹" a11y="Día anterior" onPress={() => setDate(addDays(date, -1))} />
          <T v="label" style={s.dateText}>
            {dateLabel(date)}
          </T>
          <Arrow label="›" a11y="Día siguiente" onPress={() => setDate(addDays(date, 1))} disabled={date >= today} />
        </View>
      </View>

      <Card bg={c.food}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar alimento: arroz, pechuga, yogur…"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar alimento"
          style={{ backgroundColor: c.card }}
        />
        {search.active ? (
          <FoodResults search={search} onPick={(food) => setEditing({ food })} />
        ) : (
          <>
            {favs.length > 0 && <FoodGroup title="★ Favoritos" foods={favs} onPick={(food) => setEditing({ food })} />}
            {recentOnly.length > 0 && (
              <FoodGroup title="Recientes" foods={recentOnly} onPick={(food) => setEditing({ food })} />
            )}
          </>
        )}
        <Button title="Escanear código de barras" onPress={() => setSheet('barcode')} />
        <View style={s.actions}>
          <Button title="+ Alimento propio" kind="outline" small style={s.flex} onPress={() => setSheet('custom')} />
          <Button title="+ Plato con ingredientes" kind="outline" small style={s.flex} onPress={() => setSheet('recipe')} />
        </View>
      </Card>

      {notice ? (
        <T v="label" style={s.center}>
          {notice}
        </T>
      ) : null}

      {entries.length === 0 ? (
        <Card>
          <T dim style={s.center}>
            Nada registrado este día.
          </T>
          <Button title="Copiar el día anterior" kind="outline" onPress={copyPreviousDay} />
        </Card>
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
                <View style={s.header}>
                  <T v="h">{meal}</T>
                  {date !== today && (
                    <Button title="Copiar a hoy" kind="outline" small onPress={() => copyMealToToday(meal, items)} />
                  )}
                </View>
                {items.map((e) => (
                  <Pressable key={e.id} onPress={() => setEditing({ food: e.food, entry: e })} style={s.row}>
                    <T style={s.name} numberOfLines={2}>
                      {e.food.name}{' '}
                      <T v="label" dim>
                        {e.grams} g
                      </T>
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
          fav={favs.some((f) => f.id === editing.food.id)}
          onToggleFav={() => toggleFav(editing.food)}
          onClose={() => setEditing(null)}
          onSave={(grams, meal) => saveEntry(editing.food, grams, meal, editing.entry?.id)}
          onDelete={() => {
            setEntries(entries.filter((e) => e.id !== editing.entry?.id));
            setEditing(null);
          }}
        />
      )}
      {sheet === 'custom' && (
        <CustomFoodSheet
          onClose={() => setSheet(null)}
          onSave={(food) => {
            setOwn([food, ...own]);
            setSheet(null);
            setEditing({ food });
          }}
        />
      )}
      {sheet === 'barcode' && (
        <BarcodeSheet
          onClose={() => setSheet(null)}
          onFound={(food) => {
            setSheet(null);
            setEditing({ food });
          }}
          onCreate={() => setSheet('custom')}
        />
      )}
      {sheet === 'recipe' && (
        <RecipeSheet
          own={own}
          onClose={() => setSheet(null)}
          onSave={(food) => {
            setOwn([food, ...own]);
            setSheet(null);
            setEditing({ food });
          }}
        />
      )}
    </Screen>
  );
}

function FoodGroup({ title, foods, onPick }: { title: string; foods: Food[]; onPick: (f: Food) => void }) {
  return (
    <View>
      <T v="label" dim>
        {title}
      </T>
      {foods.map((f) => (
        <FoodRow key={f.id} food={f} onPress={() => onPick(f)} />
      ))}
    </View>
  );
}

function Arrow({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={a11y} hitSlop={10} style={{ opacity: disabled ? 0.25 : 1 }}>
      <T v="h">{label}</T>
    </Pressable>
  );
}

function QuantitySheet({
  editing,
  fav,
  onToggleFav,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing;
  fav: boolean;
  onToggleFav: () => void;
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
      <View style={s.header}>
        <T v="h" style={s.flex}>
          {editing.food.name}
        </T>
        <Pressable onPress={onToggleFav} hitSlop={10} accessibilityLabel={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
          <T v="h">{fav ? '★' : '☆'}</T>
        </Pressable>
      </View>
      <Field label="Cantidad (g)" value={grams} onChangeText={setGrams} keyboardType="decimal-pad" selectTextOnFocus />
      <Segmented options={MEALS.map((x) => ({ id: x, label: x }))} value={meal} onChange={setMeal} />
      <T v="label" dim>
        {m.calories} kcal · {m.carbs}g carbos · {m.fat}g grasa · {m.protein}g prot
      </T>
      <Button
        title={editing.entry ? 'Guardar cambios' : 'Añadir'}
        onPress={() => {
          if (g > 0) onSave(g, meal);
        }}
      />
      {editing.entry && <Button title="Eliminar" kind="danger" onPress={onDelete} />}
    </Sheet>
  );
}

function CustomFoodSheet({ onClose, onSave }: { onClose: () => void; onSave: (food: Food) => void }) {
  const c = useColors();
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState('');
  const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;
  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm({ ...form, [key]: v }),
  });

  const submit = () => {
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
      <Button title="Guardar y añadir" onPress={submit} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dateNav: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontFamily: Font.bold, minWidth: 70, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 },
  name: { flex: 1, fontSize: 14 },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexGrow: 1, flexBasis: '45%' },
});
