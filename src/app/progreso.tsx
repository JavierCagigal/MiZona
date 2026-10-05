import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CaloriesChart, WeightChart } from '@/components/charts';
import { Button, Card, Screen, Segmented, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { addDays, dayKey, fromKey, lastDays } from '@/lib/dates';
import { Entry, Profile, dailyGoals, sumEntries } from '@/lib/macros';
import { loadMany, useStored } from '@/lib/store';

const RANGES = [
  { id: '7', label: '7 días' },
  { id: '30', label: '30 días' },
  { id: '90', label: '90 días' },
] as const;
type Range = (typeof RANGES)[number]['id'];

const fmt = (n: number) => Math.round(n).toLocaleString('es-ES');
const signed = (n: number, digits = 0) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits).replace('.', ',')}`;

function dateLabel(key: string) {
  if (key === dayKey()) return 'Hoy';
  if (key === addDays(dayKey(), -1)) return 'Ayer';
  return fromKey(key).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Kcal registradas por día en los últimos 90 días (solo días con algo apuntado). */
function useKcalHistory(today: string) {
  const [kcal, setKcal] = useState<Record<string, number>>({});
  useFocusEffect(
    useCallback(() => {
      const days = lastDays(90, today);
      loadMany<Entry[]>(days.map((d) => `log:${d}`), []).then((logs) =>
        setKcal(Object.fromEntries(days.flatMap((d, i) => (logs[i].length ? [[d, sumEntries(logs[i]).calories]] : []))))
      );
    }, [today])
  );
  return kcal;
}

export default function Progreso() {
  const c = useColors();
  const today = dayKey();
  const [range, setRange] = useState<Range>('30');
  const [profile] = useStored<Profile | null>('profile', null);
  const [weights] = useStored<Record<string, number>>('weights', {});
  const kcalByDay = useKcalHistory(today);
  const [width, setWidth] = useState(0);
  const [selKcal, setSelKcal] = useState<string | null>(null);
  const [selWeight, setSelWeight] = useState<string | null>(null);
  const [table, setTable] = useState(false);

  const days = lastDays(Number(range), today);
  const goal = profile ? dailyGoals(profile).calories : null;

  // Calorías
  const kcal = days.map((d) => kcalByDay[d] ?? null);
  const logged = days.filter((d) => kcalByDay[d] != null);
  const avg = logged.length ? logged.reduce((a, d) => a + kcalByDay[d], 0) / logged.length : 0;
  const overDays = goal ? logged.filter((d) => kcalByDay[d] > goal).length : 0;
  const balance = goal ? logged.reduce((a, d) => a + kcalByDay[d] - goal, 0) : 0;
  // El día elegido, si está en el rango; si no, el último con datos
  const kIdx = days.indexOf(selKcal && logged.includes(selKcal) ? selKcal : (logged.at(-1) ?? ''));

  // Peso
  const wvals = days.map((d) => weights[d] ?? null);
  const wdays = days.filter((d) => weights[d] != null);
  const wChange = wdays.length > 1 ? weights[wdays.at(-1)!] - weights[wdays[0]] : 0;
  const spanDays = wdays.length > 1 ? (fromKey(wdays.at(-1)!).getTime() - fromKey(wdays[0]).getTime()) / 864e5 : 0;
  const wIdx = days.indexOf(selWeight && wdays.includes(selWeight) ? selWeight : (wdays.at(-1) ?? ''));

  const chartWidth = Math.max(0, width - 32);

  return (
    <Screen>
      <T v="title">Progreso</T>
      <Segmented options={RANGES} value={range} onChange={setRange} />

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Card>
          <T v="h">Calorías</T>
          {!goal ? (
            <T dim>Configura tu perfil para tener un objetivo de calorías.</T>
          ) : logged.length === 0 ? (
            <>
              <T dim>No hay comidas registradas en estos días.</T>
              <Button title="Añadir comida" kind="outline" onPress={() => router.navigate('/comidas')} />
            </>
          ) : (
            <>
              {kIdx >= 0 && (
                <T v="label" dim>
                  <T v="num">{fmt(kcal[kIdx]!)}</T> kcal · {dateLabel(days[kIdx])} ·{' '}
                  {signed(kcal[kIdx]! - goal)} vs objetivo
                </T>
              )}
              {chartWidth > 0 && (
                <CaloriesChart
                  days={days}
                  values={kcal}
                  goal={goal}
                  width={chartWidth}
                  selected={kIdx >= 0 ? kIdx : null}
                  onSelect={(i) => kcal[i] != null && setSelKcal(days[i])}
                />
              )}
              <View style={s.legend}>
                <Key color={c.chartOk} label="Dentro del objetivo" />
                <Key color={c.chartOver} label="Por encima" />
              </View>
              <View style={s.stats}>
                <Stat value={fmt(avg)} label="media al día" />
                <Stat value={`${overDays}/${logged.length}`} label="días por encima" />
                <Stat value={signed(balance)} label={balance > 0 ? 'kcal de más' : 'kcal de déficit'} />
              </View>
            </>
          )}
        </Card>
      </View>

      <Card>
        <T v="h">Peso</T>
        {wdays.length < 2 ? (
          <>
            <T dim>Apunta tu peso al menos dos días (en Hoy, tarjeta Peso) para ver la gráfica.</T>
            <Button title="Ir a Hoy" kind="outline" onPress={() => router.navigate('/')} />
          </>
        ) : (
          <>
            {wIdx >= 0 && (
              <T v="label" dim>
                <T v="num">{wvals[wIdx]!.toFixed(1).replace('.', ',')}</T> kg · {dateLabel(days[wIdx])}
              </T>
            )}
            {chartWidth > 0 && (
              <WeightChart
                days={days}
                values={wvals}
                width={chartWidth}
                color={c.chartWeight}
                selected={wIdx >= 0 ? wIdx : null}
                onSelect={(i) => setSelWeight(days[i])}
              />
            )}
            <View style={s.stats}>
              <Stat value={`${weights[wdays.at(-1)!].toFixed(1).replace('.', ',')}`} label="kg ahora" />
              <Stat value={signed(wChange, 1)} label={`kg en ${RANGES.find((r) => r.id === range)!.label}`} />
              <Stat value={spanDays >= 7 ? signed((wChange / spanDays) * 7, 2) : '—'} label="kg por semana" />
            </View>
          </>
        )}
      </Card>

      <Button title={table ? 'Ocultar tabla' : 'Ver los datos en tabla'} kind="outline" small onPress={() => setTable(!table)} />
      {table && (
        <Card>
          <View style={s.tr}>
            <T v="label" dim style={s.tdDate}>
              Día
            </T>
            <T v="label" dim style={s.td}>
              Kcal
            </T>
            <T v="label" dim style={s.td}>
              Peso
            </T>
          </View>
          {[...days].reverse().filter((d) => kcalByDay[d] != null || weights[d] != null).map((d) => (
            <View key={d} style={[s.tr, { borderTopColor: c.line }, s.trLine]}>
              <T v="label" style={s.tdDate}>
                {dateLabel(d)}
              </T>
              <T v="label" style={[s.td, goal != null && (kcalByDay[d] ?? 0) > goal && { fontFamily: Font.bold }]}>
                {kcalByDay[d] != null ? fmt(kcalByDay[d]) : '—'}
              </T>
              <T v="label" style={s.td}>
                {weights[d] != null ? weights[d].toFixed(1).replace('.', ',') : '—'}
              </T>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Key({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.key}>
      <View style={[s.swatch, { backgroundColor: color }]} />
      <T v="label" dim>
        {label}
      </T>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <T v="num">{value}</T>
      <T v="label" dim>
        {label}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  stat: { flex: 1 },
  tr: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  trLine: { borderTopWidth: 1 },
  tdDate: { flex: 1.4 },
  td: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
