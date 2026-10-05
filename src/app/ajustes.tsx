import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Field, Screen, Segmented, T } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { ACTIVITY_LEVELS, Activity, GOALS, Goal, Macros, Profile, calcGoals } from '@/lib/macros';
import { useStored } from '@/lib/store';

export default function Ajustes() {
  const [profile, setProfile, loaded] = useStored<Profile | null>('profile', null);
  return (
    <Screen>
      <T v="title">Perfil</T>
      {loaded && (
        <ProfileForm
          initial={profile}
          onSave={(p) => {
            setProfile(p);
            if (!profile) router.navigate('/');
          }}
        />
      )}
    </Screen>
  );
}

const MACRO_FIELDS: { key: keyof Macros; label: string }[] = [
  { key: 'calories', label: 'Calorías (kcal)' },
  { key: 'protein', label: 'Proteína (g)' },
  { key: 'carbs', label: 'Carbohidratos (g)' },
  { key: 'fat', label: 'Grasas (g)' },
];

function ProfileForm({ initial, onSave }: { initial: Profile | null; onSave: (p: Profile) => void }) {
  const c = useColors();
  const [weight, setWeight] = useState(initial ? String(initial.weight) : '');
  const [height, setHeight] = useState(initial ? String(initial.height) : '');
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [sex, setSex] = useState<Profile['sex']>(initial?.sex ?? 'hombre');
  const [activity, setActivity] = useState<Activity>(initial?.activity ?? 'moderado');
  const [goalType, setGoalType] = useState<Goal>(initial?.goalType ?? 'mantener');
  const [overrides, setOverrides] = useState<Record<keyof Macros, string>>({
    calories: String(initial?.overrides?.calories ?? ''),
    protein: String(initial?.overrides?.protein ?? ''),
    carbs: String(initial?.overrides?.carbs ?? ''),
    fat: String(initial?.overrides?.fat ?? ''),
  });
  const [saved, setSaved] = useState(false);

  const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;
  const base = { weight: num(weight), height: num(height), age: num(age), sex, activity, goalType };
  const valid = base.weight > 0 && base.height > 0 && base.age > 0;
  const goals = valid ? calcGoals(base) : null;
  const level = ACTIVITY_LEVELS.find((a) => a.id === activity);

  const save = () => {
    if (!valid) return;
    const manual = Object.fromEntries(
      Object.entries(overrides)
        .filter(([, v]) => num(v) > 0)
        .map(([k, v]) => [k, num(v)])
    );
    onSave({ ...base, overrides: Object.keys(manual).length ? manual : null });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <>
      <Card>
        <T v="h">Tus datos</T>
        <View style={s.grid}>
          <View style={s.cell}>
            <Field label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="75" />
          </View>
          <View style={s.cell}>
            <Field label="Altura (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="178" />
          </View>
          <View style={s.cell}>
            <Field label="Edad" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="28" />
          </View>
        </View>
        <T v="label" dim>
          Sexo
        </T>
        <Segmented
          options={[
            { id: 'hombre', label: 'Hombre' },
            { id: 'mujer', label: 'Mujer' },
          ]}
          value={sex}
          onChange={setSex}
        />
        <T v="label" dim>
          Actividad · {level?.hint}
        </T>
        <Segmented options={ACTIVITY_LEVELS} value={activity} onChange={setActivity} />
        <T v="label" dim>
          Objetivo
        </T>
        <Segmented options={GOALS} value={goalType} onChange={setGoalType} />
      </Card>

      {goals ? (
        <Card bg={c.profile}>
          <T v="h">Tu objetivo diario</T>
          <View style={s.grid}>
            {MACRO_FIELDS.map((f) => (
              <View key={f.key} style={s.cell}>
                <Field
                  label={f.label}
                  value={overrides[f.key]}
                  onChangeText={(v) => setOverrides({ ...overrides, [f.key]: v })}
                  placeholder={String(goals[f.key])}
                  keyboardType="number-pad"
                  style={{ backgroundColor: c.card }}
                />
              </View>
            ))}
          </View>
          <T v="label" dim>
            Calculado con tus datos (gasto estimado {goals.tdee} kcal/día). Escribe un número solo si quieres
            cambiarlo.
          </T>
        </Card>
      ) : (
        <T dim>Rellena peso, altura y edad para calcular tu objetivo.</T>
      )}

      <Button title={saved ? 'Guardado ✓' : 'Guardar'} onPress={save} style={!valid && { opacity: 0.4 }} />
    </>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexGrow: 1, flexBasis: '30%', minWidth: 120 },
});
