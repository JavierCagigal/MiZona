import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FoodResults, useFoodSearch } from '@/components/food-search';
import { Button, Field, Input, Sheet, T } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { Food, recipePer100, uid } from '@/lib/macros';

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;

/** Crea un plato propio a partir de sus ingredientes. Se guarda como un alimento más, con valores por 100 g. */
export function RecipeSheet({ own, onClose, onSave }: { own: Food[]; onClose: () => void; onSave: (food: Food) => void }) {
  const c = useColors();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<{ food: Food; grams: string }[]>([]);
  const [cooked, setCooked] = useState('');
  const [error, setError] = useState('');
  const search = useFoodSearch(query, own);

  const parsed = items.map((i) => ({ food: i.food, grams: num(i.grams) }));
  const per100 = recipePer100(parsed, num(cooked));
  const rawWeight = parsed.reduce((n, i) => n + i.grams, 0);

  const save = () => {
    if (!name.trim() || parsed.every((i) => i.grams <= 0)) {
      setError('Ponle nombre y añade al menos un ingrediente con cantidad.');
      return;
    }
    onSave({ id: uid(), source: 'recipe', name: name.trim(), ...per100 });
  };

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">Nuevo plato</T>
      <Field label="Nombre" value={name} onChangeText={setName} placeholder="Lentejas de casa" />

      <T v="label" dim>
        Ingredientes (pesa cada uno tal y como lo echas)
      </T>
      {items.map((it, i) => (
        <View key={it.food.id + i} style={s.item}>
          <T style={s.itemName} numberOfLines={2}>
            {it.food.name}
          </T>
          <Input
            value={it.grams}
            onChangeText={(g) => setItems(items.map((x, j) => (j === i ? { ...x, grams: g } : x)))}
            keyboardType="decimal-pad"
            style={s.grams}
            accessibilityLabel={`Gramos de ${it.food.name}`}
          />
          <T v="label" dim>
            g
          </T>
          <Pressable
            onPress={() => setItems(items.filter((_, j) => j !== i))}
            hitSlop={8}
            accessibilityLabel={`Quitar ${it.food.name}`}>
            <T v="h" dim>
              ×
            </T>
          </Pressable>
        </View>
      ))}

      <Input value={query} onChangeText={setQuery} placeholder="Añadir ingrediente…" autoCorrect={false} />
      <FoodResults
        search={search}
        onPick={(food) => {
          setItems([...items, { food, grams: '100' }]);
          setQuery('');
        }}
      />

      <Field
        label={`Peso final cocinado en g (opcional; sin cocinar suma ${Math.round(rawWeight)} g)`}
        value={cooked}
        onChangeText={setCooked}
        keyboardType="decimal-pad"
        placeholder={String(Math.round(rawWeight))}
      />
      <T v="label" dim>
        Por 100 g: {Math.round(per100.kcal100)} kcal · {per100.carbs100}g carbos · {per100.fat100}g grasa ·{' '}
        {per100.protein100}g prot
      </T>
      {error ? (
        <T v="label" style={{ color: c.danger }}>
          {error}
        </T>
      ) : null}
      <Button title="Guardar plato" onPress={save} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { flex: 1, fontSize: 14 },
  grams: { width: 76, paddingVertical: 8, textAlign: 'right' },
});
