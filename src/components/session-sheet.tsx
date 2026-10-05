import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, Input, Segmented, Sheet, T } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { dayKey } from '@/lib/dates';
import { uid } from '@/lib/macros';
import { SPORTS, Session, Sport, pace } from '@/lib/training';

type SetText = { reps: string; kg: string };
type ExerciseText = { name: string; sets: SetText[] };

const num = (v: string) => parseFloat(v.replace(',', '.')) || 0;
const str = (n: number) => (n ? String(n) : '');

export function SessionSheet({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: Session;
  onClose: () => void;
  onSave: (s: Session) => void;
  onDelete?: () => void;
}) {
  const c = useColors();
  const [sport, setSport] = useState<Sport>(initial?.sport ?? 'carrera');
  const [minutes, setMinutes] = useState(str(initial?.minutes ?? 0));
  const [km, setKm] = useState(str(initial?.km ?? 0));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [exercises, setExercises] = useState<ExerciseText[]>(
    initial?.exercises.map((e) => ({ name: e.name, sets: e.sets.map((x) => ({ reps: str(x.reps), kg: str(x.kg) })) })) ?? [
      { name: '', sets: [{ reps: '', kg: '' }] },
    ]
  );

  const setEx = (i: number, patch: Partial<ExerciseText>) =>
    setExercises(exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const setSet = (i: number, k: number, patch: Partial<SetText>) =>
    setEx(i, { sets: exercises[i].sets.map((x, j) => (j === k ? { ...x, ...patch } : x)) });

  const strength = sport === 'fuerza';
  const speed = pace(sport, num(km), num(minutes));

  const submit = () =>
    onSave({
      id: initial?.id ?? uid(),
      date: initial?.date ?? dayKey(),
      sport,
      minutes: num(minutes),
      km: strength ? 0 : num(km),
      notes: notes.trim(),
      exercises: strength
        ? exercises
            .filter((e) => e.name.trim())
            .map((e) => ({
              name: e.name.trim(),
              sets: e.sets.filter((x) => num(x.reps) > 0).map((x) => ({ reps: num(x.reps), kg: num(x.kg) })),
            }))
        : [],
    });

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">{initial ? 'Editar sesión' : 'Nueva sesión'}</T>
      <Segmented options={SPORTS} value={sport} onChange={setSport} />

      {strength ? (
        <>
          {exercises.map((e, i) => (
            <View key={i} style={[s.exercise, { borderColor: c.line }]}>
              <View style={s.row}>
                <Input
                  value={e.name}
                  onChangeText={(name) => setEx(i, { name })}
                  placeholder="Ejercicio (ej. Sentadilla)"
                  style={s.flex}
                />
                {exercises.length > 1 && (
                  <Pressable
                    onPress={() => setExercises(exercises.filter((_, j) => j !== i))}
                    hitSlop={8}
                    accessibilityLabel="Quitar ejercicio">
                    <T v="h" dim>
                      ×
                    </T>
                  </Pressable>
                )}
              </View>
              {e.sets.map((x, k) => (
                <View key={k} style={s.row}>
                  <T v="label" dim style={s.setLabel}>
                    Serie {k + 1}
                  </T>
                  <Input
                    value={x.reps}
                    onChangeText={(reps) => setSet(i, k, { reps })}
                    keyboardType="number-pad"
                    placeholder="0"
                    style={s.small}
                    accessibilityLabel={`Repeticiones serie ${k + 1}`}
                  />
                  <T v="label" dim>
                    reps
                  </T>
                  <Input
                    value={x.kg}
                    onChangeText={(kg) => setSet(i, k, { kg })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    style={s.small}
                    accessibilityLabel={`Kilos serie ${k + 1}`}
                  />
                  <T v="label" dim>
                    kg
                  </T>
                  {e.sets.length > 1 && (
                    <Pressable
                      onPress={() => setEx(i, { sets: e.sets.filter((_, j) => j !== k) })}
                      hitSlop={8}
                      accessibilityLabel="Quitar serie">
                      <T dim>×</T>
                    </Pressable>
                  )}
                </View>
              ))}
              <Button
                title="+ Serie"
                kind="outline"
                small
                onPress={() => setEx(i, { sets: [...e.sets, { ...(e.sets.at(-1) ?? { reps: '', kg: '' }) }] })}
              />
            </View>
          ))}
          <Button
            title="+ Ejercicio"
            kind="outline"
            onPress={() => setExercises([...exercises, { name: '', sets: [{ reps: '', kg: '' }] }])}
          />
          <Field label="Duración (min, opcional)" value={minutes} onChangeText={setMinutes} keyboardType="number-pad" />
        </>
      ) : (
        <>
          <View style={s.row}>
            <View style={s.flex}>
              <Field label="Distancia (km)" value={km} onChangeText={setKm} keyboardType="decimal-pad" placeholder="10" />
            </View>
            <View style={s.flex}>
              <Field label="Tiempo (min)" value={minutes} onChangeText={setMinutes} keyboardType="decimal-pad" placeholder="50" />
            </View>
          </View>
          {speed && (
            <T v="label" dim>
              Ritmo: {speed}
            </T>
          )}
        </>
      )}

      <Field label="Notas" value={notes} onChangeText={setNotes} placeholder="Sensaciones, ruta, desnivel…" multiline />
      <Button title="Guardar sesión" onPress={submit} />
      {onDelete && <Button title="Eliminar" kind="danger" onPress={onDelete} />}
    </Sheet>
  );
}

const s = StyleSheet.create({
  exercise: { gap: 8, borderWidth: 1, borderRadius: 18, padding: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  setLabel: { width: 58 },
  small: { width: 64, paddingVertical: 8, textAlign: 'center' },
});
