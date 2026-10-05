// Fórmula de Mifflin-St Jeor + factor de actividad + reparto de macros según objetivo.

export const ACTIVITY_LEVELS = [
  { id: 'sedentario', label: 'Sedentario', hint: 'Poco o nada de ejercicio', factor: 1.2 },
  { id: 'ligero', label: 'Ligero', hint: '1-3 días por semana', factor: 1.375 },
  { id: 'moderado', label: 'Moderado', hint: '3-5 días por semana', factor: 1.55 },
  { id: 'activo', label: 'Activo', hint: '6-7 días por semana', factor: 1.725 },
  { id: 'muy_activo', label: 'Muy activo', hint: 'Entreno intenso a diario', factor: 1.9 },
] as const;

export const GOALS = [
  { id: 'perder', label: 'Perder grasa' },
  { id: 'mantener', label: 'Mantener' },
  { id: 'ganar', label: 'Ganar músculo' },
] as const;

export const MEALS = ['Desayuno', 'Comida', 'Merienda', 'Cena', 'Otro'] as const;

export type Activity = (typeof ACTIVITY_LEVELS)[number]['id'];
export type Goal = (typeof GOALS)[number]['id'];
export type Meal = (typeof MEALS)[number];
export type Macros = { calories: number; protein: number; carbs: number; fat: number };

export type Profile = {
  weight: number;
  height: number;
  age: number;
  sex: 'hombre' | 'mujer';
  activity: Activity;
  goalType: Goal;
  overrides: Partial<Macros> | null;
};

export type Food = {
  id: string;
  source: 'basic' | 'off' | 'custom' | 'recipe';
  name: string;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
};

export type Entry = { id: string; meal: Meal; grams: number; food: Food };

export function calcBMR({ weight, height, age, sex }: Pick<Profile, 'weight' | 'height' | 'age' | 'sex'>) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'mujer' ? base - 161 : base + 5;
}

export function calcGoals(profile: Omit<Profile, 'overrides'>) {
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) ?? ACTIVITY_LEVELS[1];
  const bmr = calcBMR(profile);
  const tdee = bmr * activity.factor;

  let calories, proteinPerKg, fatPct;
  if (profile.goalType === 'perder') {
    calories = tdee * 0.8;
    proteinPerKg = 2.2;
    fatPct = 0.25;
  } else if (profile.goalType === 'ganar') {
    calories = tdee * 1.12;
    proteinPerKg = 1.9;
    fatPct = 0.25;
  } else {
    calories = tdee;
    proteinPerKg = 1.8;
    fatPct = 0.28;
  }

  const protein = proteinPerKg * profile.weight;
  const fat = (calories * fatPct) / 9;
  const carbs = Math.max(0, (calories - protein * 4 - fat * 9) / 4);

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

/** Objetivo real del día: lo calculado, pisado por lo que el usuario haya ajustado a mano. */
export function dailyGoals(profile: Profile): Macros {
  const { calories, protein, carbs, fat } = calcGoals(profile);
  return { calories, protein, carbs, fat, ...profile.overrides };
}

export function scale(food: Food, grams: number): Macros {
  const f = grams / 100;
  return {
    calories: Math.round(food.kcal100 * f),
    protein: Math.round(food.protein100 * f),
    carbs: Math.round(food.carbs100 * f),
    fat: Math.round(food.fat100 * f),
  };
}

export function sumEntries(entries: Pick<Entry, 'food' | 'grams'>[]): Macros {
  return entries.reduce(
    (acc, e) => {
      const m = scale(e.food, e.grams);
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Valores por 100 g de un plato a partir de sus ingredientes.
 * Si se indica el peso final (tras cocinar), se reparte sobre ese peso; si no, sobre la suma de ingredientes.
 */
export function recipePer100(items: Pick<Entry, 'food' | 'grams'>[], cookedGrams?: number) {
  const total = sumEntries(items);
  const weight = cookedGrams || items.reduce((n, i) => n + i.grams, 0);
  const per100 = (v: number) => (weight > 0 ? Math.round((v * 1000) / weight) / 10 : 0);
  return {
    kcal100: per100(total.calories),
    protein100: per100(total.protein),
    carbs100: per100(total.carbs),
    fat100: per100(total.fat),
  };
}

/** ~35 ml por kg de peso, redondeado a vasos de 250 ml. */
export function waterGoal(weight?: number) {
  return weight ? Math.round((weight * 35) / 250) * 250 : 2000;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
