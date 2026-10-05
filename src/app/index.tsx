import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ProfileForm } from '@/components/profile-form';
import { Bar, Button, Card, Field, Screen, Segmented, Sheet, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { DAY_NAMES, addDays, dayKey, fromKey, isoDayIndex, lastDays, streak } from '@/lib/dates';
import { Entry, Profile, dailyGoals, scale, sumEntries, waterGoal } from '@/lib/macros';
import { loadMany, useStored } from '@/lib/store';

type DayPlan = { day: string; name: string; notes: string };
const GLASS = 250;
const MEASURES = [
  { id: 'cintura', label: 'Cintura' },
  { id: 'cadera', label: 'Cadera' },
  { id: 'pecho', label: 'Pecho' },
  { id: 'brazo', label: 'Brazo' },
  { id: 'muslo', label: 'Muslo' },
] as const;
type MeasureId = (typeof MEASURES)[number]['id'];
type Measures = Record<string, Partial<Record<MeasureId, number>>>;

const liters = (ml: number) => `${+(ml / 1000).toFixed(2)}L`;

export default function Hoy() {
  const c = useColors();
  const today = dayKey();
  const [profile, setProfile, profileLoaded] = useStored<Profile | null>('profile', null);
  const [entries] = useStored<Entry[]>(`log:${today}`, []);
  const [weights, setWeights] = useStored<Record<string, number>>('weights', {});
  const [measures, setMeasures] = useStored<Measures>('measures', {});
  const [water, setWater] = useStored<Record<string, number>>('water', {});
  const [week] = useStored<DayPlan[] | null>('week', null);
  const [done, setDone] = useStored(`done:${today}`, false);
  const { days, weekDone } = useHistory(today);
  const [weighing, setWeighing] = useState(false);
  const [waterView, setWaterView] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  const weekKeys = lastDays(7, addDays(today, 6 - isoDayIndex()));

  if (!profileLoaded) return <Screen>{null}</Screen>;

  if (!profile) return <Welcome onDone={setProfile} />;

  const goals = dailyGoals(profile);
  const totals = sumEntries(entries);

  const recent = lastDays(30, today).filter((k) => weights[k] != null);
  const series = recent.map((k) => weights[k]);
  const current = series.at(-1) ?? profile.weight;
  const change = series.length > 1 ? current - series[0] : 0;

  const ml = water[today] ?? 0;
  const mlGoal = waterGoal(profile.weight);
  const addWater = (delta: number) => setWater({ ...water, [today]: Math.max(0, ml + delta) });

  const plan = week?.[isoDayIndex()];
  const saveBody = (kg: number, m: Partial<Record<MeasureId, number>>) => {
    setWeights({ ...weights, [today]: kg });
    setProfile({ ...profile, weight: kg });
    if (Object.keys(m).length) setMeasures({ ...measures, [today]: { ...measures[today], ...m } });
    setWeighing(false);
  };

  return (
    <Screen>
      <View style={s.header}>
        <T v="title">Hoy</T>
        {days > 0 && (
          <View style={[s.pill, { backgroundColor: c.weight }]}>
            <T v="label">🔥 {days}</T>
          </View>
        )}
      </View>

      <Card>
        <View style={s.tiles}>
          <Tile label="Kcal" value={totals.calories} goal={goals.calories} />
          <Tile label="Carbos" value={totals.carbs} goal={goals.carbs} />
          <Tile label="Prot" value={totals.protein} goal={goals.protein} />
          <Tile label="Grasa" value={totals.fat} goal={goals.fat} />
        </View>

        {entries.length === 0 ? (
          <T dim>Aún no has registrado nada hoy.</T>
        ) : (
          entries.map((e) => {
            const m = scale(e.food, e.grams);
            return (
              <View key={e.id} style={s.entry}>
                <T style={s.entryName}>{e.food.name}</T>
                <T v="label" dim>
                  {m.calories} kcal · {m.carbs}g carbos · {m.fat}g grasa · {m.protein}g prot
                </T>
              </View>
            );
          })
        )}
        <Button title="+ Añadir comida" kind="outline" onPress={() => router.navigate('/comidas')} />
      </Card>

      <View style={s.row}>
        <Card bg={c.weight} style={s.half} onPress={() => setWeighing(true)}>
          <T v="h">Peso</T>
          {series.length > 1 ? (
            <Spark values={series} color={c.weightInk} />
          ) : (
            <T v="label" dim style={s.hint}>
              Toca para apuntar tu peso y tus medidas
            </T>
          )}
          <View style={s.stats}>
            <Stat value={current.toFixed(1)} label="kg" />
            <Stat value={`${change > 0 ? '+' : ''}${change.toFixed(1)}`} label="30 días" />
          </View>
        </Card>

        <Card bg={c.activity} style={s.half}>
          <T v="h">Actividad</T>
          <T v="label" dim numberOfLines={2}>
            {plan?.name || 'Descanso'}
          </T>
          <View style={s.weekRow}>
            {weekKeys.map((k, i) => {
              const isDone = k === today ? done : weekDone[i];
              return (
                <View key={k} style={s.weekDay}>
                  <View
                    style={[
                      s.dot,
                      { borderColor: c.activityInk },
                      isDone && { backgroundColor: c.activityInk },
                      k === today && s.dotToday,
                    ]}
                  />
                  <T v="label" dim>
                    {DAY_NAMES[i][0]}
                  </T>
                </View>
              );
            })}
          </View>
          {plan?.name ? (
            <Button
              title={done ? 'Hecho ✓' : 'Marcar hecho'}
              kind={done ? 'solid' : 'outline'}
              onPress={() => setDone(!done)}
            />
          ) : (
            <Button title="Planificar" kind="outline" onPress={() => router.navigate('/actividad')} />
          )}
        </Card>
      </View>

      <Card bg={c.water}>
        <View style={s.header}>
          <T v="h">Agua</T>
          <View style={s.row}>
            <Round label="−" onPress={() => addWater(-GLASS)} />
            <Round label="+" onPress={() => addWater(GLASS)} />
          </View>
        </View>
        {waterView === 'hoy' ? (
          <>
            <View style={s.glasses}>
              {Array.from({ length: Math.max(mlGoal, ml) / GLASS }, (_, i) => (
                <View
                  key={i}
                  style={[s.glass, { borderColor: c.waterInk }, i < ml / GLASS && { backgroundColor: c.waterInk }]}
                />
              ))}
            </View>
            <View style={s.waterFoot}>
              <T v="label" dim>
                {Math.round((ml / mlGoal) * 100)}% de {mlGoal / 1000} L
              </T>
              <T v="big">{liters(ml)}</T>
            </View>
          </>
        ) : (
          <WaterHistory days={lastDays(waterView === 'semana' ? 7 : 30, today)} water={water} goal={mlGoal} />
        )}
        <Segmented
          options={[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mes' },
          ]}
          value={waterView}
          onChange={setWaterView}
        />
      </Card>

      <T v="label" dim style={s.note}>
        Valores orientativos. No sustituyen el consejo de un profesional.
      </T>

      <BodySheet
        visible={weighing}
        initial={current}
        measures={measures}
        onClose={() => setWeighing(false)}
        onSave={saveBody}
      />
    </Screen>
  );
}

/** Racha de días con comidas registradas y entrenos hechos esta semana (lunes a domingo). */
function useHistory(today: string) {
  const [days, setDays] = useState(0);
  const [weekDone, setWeekDone] = useState<boolean[]>([]);
  useFocusEffect(
    useCallback(() => {
      const past = lastDays(60, today);
      loadMany<Entry[]>(past.map((k) => `log:${k}`), []).then((logs) => {
        const withLog = new Set(past.filter((_, i) => logs[i].length > 0));
        setDays(streak((k) => withLog.has(k), today));
      });
      loadMany(lastDays(7, addDays(today, 6 - isoDayIndex())).map((k) => `done:${k}`), false).then(setWeekDone);
    }, [today])
  );
  return { days, weekDone };
}

function Tile({ label, value, goal }: { label: string; value: number; goal: number }) {
  const c = useColors();
  const over = value > goal;
  return (
    <View style={[s.tile, { backgroundColor: c.bg }]}>
      <T v="label" dim>
        {label}
      </T>
      <T v="num">{Math.round(value)}</T>
      <T v="label" dim>
        de {Math.round(goal)}
      </T>
      <Bar pct={(value / goal) * 100} color={over ? c.danger : c.text} track={c.line} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <T v="num">{value}</T>
      <T v="label" dim>
        {label}
      </T>
    </View>
  );
}

function Round({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Añadir un vaso' : 'Quitar un vaso'}
      style={({ pressed }) => [s.round, { backgroundColor: c.waterInk }, pressed && { opacity: 0.7 }]}>
      <T v="h" style={{ color: c.card }}>
        {label}
      </T>
    </Pressable>
  );
}

/** Mini gráfica de área, escalada al rango de los propios valores. */
function Spark({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const line = values
    .map((v, i) => `${i ? 'L' : 'M'}${(i / (values.length - 1)) * 100},${4 + (1 - (v - min) / span) * 30}`)
    .join(' ');
  return (
    <View style={s.spark}>
      <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
        <Path d={`${line} L100,40 L0,40 Z`} fill={color} fillOpacity={0.3} />
        <Path d={line} stroke={color} strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
      </Svg>
    </View>
  );
}

function BodySheet({
  visible,
  initial,
  measures,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: number;
  measures: Measures;
  onClose: () => void;
  onSave: (kg: number, m: Partial<Record<MeasureId, number>>) => void;
}) {
  const [text, setText] = useState('');
  const [m, setM] = useState<Partial<Record<MeasureId, string>>>({});
  const kg = parseFloat((text || String(initial)).replace(',', '.'));
  const dates = Object.keys(measures).sort();

  const trend = (id: MeasureId) => {
    const values = dates.map((d) => measures[d][id]).filter((v): v is number => v != null);
    if (values.length === 0) return '';
    const diff = values.at(-1)! - values[0];
    return ` · última ${values.at(-1)}${values.length > 1 ? ` (${diff > 0 ? '+' : ''}${+diff.toFixed(1)})` : ''}`;
  };

  const submit = () => {
    if (!(kg > 0 && kg < 400)) return;
    const parsed = Object.fromEntries(
      Object.entries(m)
        .map(([k, v]) => [k, parseFloat((v ?? '').replace(',', '.'))])
        .filter(([, v]) => (v as number) > 0)
    );
    onSave(kg, parsed);
    setText('');
    setM({});
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="h">Peso y medidas de hoy</T>
      <Field label="Peso (kg)" value={text} onChangeText={setText} placeholder={initial.toFixed(1)} keyboardType="decimal-pad" />
      <T v="label" dim>
        Medidas en cm (opcional). Mídete siempre en el mismo sitio y a la misma hora.
      </T>
      <View style={s.measures}>
        {MEASURES.map((x) => (
          <View key={x.id} style={s.measure}>
            <Field
              label={`${x.label}${trend(x.id)}`}
              value={m[x.id] ?? ''}
              onChangeText={(v) => setM({ ...m, [x.id]: v })}
              keyboardType="decimal-pad"
            />
          </View>
        ))}
      </View>
      <Button title="Guardar" onPress={submit} />
    </Sheet>
  );
}

/** Barras de agua por día; llenas si se llegó al objetivo. */
function WaterHistory({ days, water, goal }: { days: string[]; water: Record<string, number>; goal: number }) {
  const c = useColors();
  const values = days.map((d) => water[d] ?? 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const hits = values.filter((v) => v >= goal).length;
  const week = days.length <= 7;
  return (
    <>
      <View style={s.bars}>
        {days.map((d, i) => (
          <View key={d} style={s.barCol}>
            <View style={s.barTrack}>
              <View
                style={[
                  s.barFill,
                  {
                    height: `${Math.min(100, (values[i] / goal) * 100)}%`,
                    backgroundColor: c.waterInk,
                    opacity: values[i] >= goal ? 1 : 0.45,
                  },
                ]}
              />
            </View>
            {week && (
              <T v="label" dim>
                {DAY_NAMES[isoDayIndex(fromKey(d))][0]}
              </T>
            )}
          </View>
        ))}
      </View>
      <View style={s.waterFoot}>
        <T v="label" dim>
          Objetivo cumplido {hits} de {days.length} días
        </T>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="big">{liters(avg)}</T>
          <T v="label" dim>
            media al día
          </T>
        </View>
      </View>
    </>
  );
}

/** Primera vez: qué es MiZona y, después, el perfil. */
function Welcome({ onDone }: { onDone: (p: Profile) => void }) {
  const c = useColors();
  const [step, setStep] = useState(0);

  if (step === 1) {
    return (
      <Screen>
        <T v="title">Cuéntame de ti</T>
        <T dim>Con esto calculo tus calorías y macros. Puedes cambiarlo cuando quieras en Perfil.</T>
        <ProfileForm initial={null} onSave={onDone} />
      </Screen>
    );
  }

  return (
    <Screen>
      <T v="title">MiZona</T>
      <T dim>Tu comida, tu deporte y tu progreso, en un mismo sitio.</T>
      <Card bg={c.food}>
        <T v="h">Come</T>
        <T>Apunta lo que comes en segundos: básicos, productos de marca o tus propios platos.</T>
      </Card>
      <Card bg={c.activity}>
        <T v="h">Muévete</T>
        <T>Corre, nada, pedalea o levanta. Registra tus sesiones y bate tus récords.</T>
      </Card>
      <Card bg={c.water}>
        <T v="h">Mide</T>
        <T>Peso, medidas y agua, con gráficas para ver cómo avanzas.</T>
      </Card>
      <Button title="Empezar" onPress={() => setStep(1)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexGrow: 1, flexBasis: '22%', minWidth: 70, borderRadius: 16, padding: 10, gap: 3 },
  entry: { gap: 2 },
  entryName: { fontFamily: Font.bold, fontSize: 14 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, minHeight: 210, justifyContent: 'space-between' },
  spark: { marginHorizontal: -16, flexGrow: 1, minHeight: 56 },
  hint: { flexGrow: 1 },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  dotToday: { transform: [{ scale: 1.25 }] },
  glasses: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  glass: { width: 22, height: 30, borderRadius: 6, borderWidth: 1.5 },
  waterFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  note: { textAlign: 'center', fontSize: 10 },
  measures: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measure: { flexGrow: 1, flexBasis: '45%' },
  bars: { flexDirection: 'row', gap: 4, height: 96, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
});
