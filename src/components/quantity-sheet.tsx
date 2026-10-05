import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, Segmented, Sheet, T } from '@/components/ui';
import { Entry, Food, MEALS, Meal, scale } from '@/lib/macros';

export type Editing = { food: Food; entry?: Entry };

export function mealNow(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'Desayuno' : h < 16 ? 'Comida' : h < 20 ? 'Merienda' : 'Cena';
}

/** Cantidad y comida de un alimento: para añadirlo o para editar/borrar un registro. */
export function QuantitySheet({
  editing,
  defaultMeal,
  fav,
  onToggleFav,
  onClose,
  onSave,
  onDelete,
}: {
  editing: Editing;
  defaultMeal?: Meal;
  fav: boolean;
  onToggleFav: () => void;
  onClose: () => void;
  onSave: (grams: number, meal: Meal) => void;
  onDelete: () => void;
}) {
  const [grams, setGrams] = useState(String(editing.entry?.grams ?? 100));
  const [meal, setMeal] = useState<Meal>(editing.entry?.meal ?? defaultMeal ?? mealNow());
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

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
