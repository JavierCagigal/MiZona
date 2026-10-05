import { StyleSheet, View } from 'react-native';

import { Card, Field, Screen, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { DAY_NAMES, isoDayIndex } from '@/lib/dates';
import { useStored } from '@/lib/store';

type DayPlan = { day: string; name: string; notes: string };
const EMPTY_WEEK: DayPlan[] = DAY_NAMES.map((day) => ({ day, name: '', notes: '' }));

export default function Actividad() {
  const c = useColors();
  const [week, setWeek] = useStored<DayPlan[] | null>('week', null);
  const plan = week ?? EMPTY_WEEK;
  const todayIdx = isoDayIndex();

  const edit = (i: number, patch: Partial<DayPlan>) => setWeek(plan.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <Screen>
      <T v="title">Actividad</T>
      <T dim>Tu semana tipo. Se repite cada semana: cámbiala cuando cambies de rutina.</T>

      {plan.map((d, i) => (
        <Card key={d.day} bg={i === todayIdx ? c.activity : undefined}>
          <View style={s.head}>
            <T v="h">{d.day}</T>
            {i === todayIdx && (
              <T v="label" style={{ color: c.activityInk, fontFamily: Font.bold }}>
                HOY
              </T>
            )}
          </View>
          <Field
            label="Qué toca"
            value={d.name}
            onChangeText={(name) => edit(i, { name })}
            placeholder={PLACEHOLDERS[i]}
          />
          <Field
            label="Notas"
            value={d.notes}
            onChangeText={(notes) => edit(i, { notes })}
            placeholder="Ritmo, series, distancia…"
            multiline
          />
        </Card>
      ))}
    </Screen>
  );
}

const PLACEHOLDERS = [
  'Rodaje suave 8 km',
  'Fuerza: piernas y core',
  'Natación 2.000 m',
  'Descanso',
  'Series en pista',
  'Salida en bici 60 km',
  'Descanso',
];

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
