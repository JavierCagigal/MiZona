import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { T } from '@/components/ui';
import { searchLocal } from '@/lib/basic-foods';
import { searchOpenFoodFacts } from '@/lib/food-api';
import { Food } from '@/lib/macros';

const TAGS: Partial<Record<Food['source'], string>> = { custom: 'propio', recipe: 'receta' };

/** Resultados locales al instante (tuyos + básicos) y los de Open Food Facts cuando llegan. */
export function useFoodSearch(query: string, own: Food[]) {
  const q = query.trim();
  const [remote, setRemote] = useState<{ q: string; foods: Food[] | null } | null>(null);

  useEffect(() => {
    if (q.length < 3) return;
    let alive = true;
    const t = setTimeout(async () => {
      const foods = await searchOpenFoodFacts(q);
      if (alive) setRemote({ q, foods });
    }, 450);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const fetched = remote?.q === q ? remote.foods : undefined;
  return {
    active: q.length >= 2,
    foods: q.length >= 2 ? [...searchLocal(q, own), ...(fetched ?? [])] : [],
    loading: q.length >= 3 && fetched === undefined,
    offline: fetched === null,
  };
}

export function FoodResults({
  search,
  onPick,
}: {
  search: ReturnType<typeof useFoodSearch>;
  onPick: (food: Food) => void;
}) {
  if (!search.active) return null;
  return (
    <>
      {search.foods.map((f) => (
        <FoodRow key={f.id} food={f} onPress={() => onPick(f)} />
      ))}
      {search.loading ? (
        <T v="label" dim>
          Buscando productos de marca…
        </T>
      ) : search.offline ? (
        <T v="label" dim>
          No se pudieron buscar productos de marca (sin conexión o Open Food Facts no responde). Prueba en un rato.
        </T>
      ) : (
        search.foods.length === 0 && (
          <T v="label" dim>
            Sin resultados. Puedes crear el alimento tú.
          </T>
        )
      )}
    </>
  );
}

export function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  const tag = TAGS[food.source];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}>
      <T style={s.name} numberOfLines={2}>
        {food.name}
        {tag && (
          <T v="label" dim>
            {'  '}
            {tag}
          </T>
        )}
      </T>
      <T v="label" dim>
        {Math.round(food.kcal100)} kcal/100g
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 },
  name: { flex: 1, fontSize: 14 },
});
