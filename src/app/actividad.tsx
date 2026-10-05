import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SessionSheet } from '@/components/session-sheet';
import { Button, Card, Field, Screen, Sheet, T } from '@/components/ui';
import { Font, useColors } from '@/constants/theme';
import { DAY_NAMES, addDays, dayKey, fromKey, isoDayIndex } from '@/lib/dates';
import { save, useStored } from '@/lib/store';
import { Session, records, sportLabel, summary } from '@/lib/training';

type DayPlan = { day: string; name: string; notes: string };
const EMPTY_WEEK: DayPlan[] = DAY_NAMES.map((day) => ({ day, name: '', notes: '' }));
const PLACEHOLDERS = ['Rodaje suave 8 km', 'Fuerza: piernas y core', 'Natación 2.000 m', 'Descanso', 'Series en pista', 'Salida en bici 60 km', 'Descanso'];

function dateLabel(key: string) {
  if (key === dayKey()) return 'Hoy';
  if (key === addDays(dayKey(), -1)) return 'Ayer';
  return fromKey(key).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Actividad() {
  const c = useColors();
  const [week, setWeek] = useStored<DayPlan[] | null>('week', null);
  const [sessions, setSessions] = useStored<Session[]>('sessions', []);
  const [editing, setEditing] = useState<Session | 'new' | null>(null);
  const [planning, setPlanning] = useState(false);
  const plan = week ?? EMPTY_WEEK;
  const todayIdx = isoDayIndex();
  const best = records(sessions);
  const history = [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  const saveSession = (s: Session) => {
    setSessions(sessions.some((x) => x.id === s.id) ? sessions.map((x) => (x.id === s.id ? s : x)) : [...sessions, s]);
    save(`done:${s.date}`, true);
    setEditing(null);
  };

  return (
    <Screen>
      <T v="title">Actividad</T>
      <Button title="+ Registrar sesión" onPress={() => setEditing('new')} />

      <Card bg={c.activity}>
        <View style={s.head}>
          <T v="h">Tu semana tipo</T>
          <Button title="Editar" kind="outline" small onPress={() => setPlanning(true)} />
        </View>
        {plan.map((d, i) => (
          <View key={d.day} style={s.planRow}>
            <T v="label" style={[s.day, i === todayIdx && { color: c.activityInk, fontFamily: Font.bold }]}>
              {d.day.slice(0, 3)}
            </T>
            <T style={s.flex} dim={!d.name} numberOfLines={1}>
              {d.name || 'Descanso'}
            </T>
          </View>
        ))}
      </Card>

      {(best.lifts.length > 0 || best.distance.length > 0) && (
        <Card bg={c.weight}>
          <T v="h">Récords</T>
          {best.distance.map((d) => (
            <View key={d.sport} style={s.recRow}>
              <T style={s.flex}>{sportLabel(d.sport)} · más largo</T>
              <T v="num">{d.km} km</T>
            </View>
          ))}
          {best.lifts.slice(0, 8).map((l) => (
            <View key={l.name} style={s.recRow}>
              <T style={s.flex} numberOfLines={1}>
                {l.name}
              </T>
              <T v="num">
                {l.kg} kg
                <T v="label" dim>
                  {' '}× {l.reps}
                </T>
              </T>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <T v="h">Historial</T>
        {history.length === 0 ? (
          <T dim>Aún no has registrado ninguna sesión. Corre, nada, pedalea o levanta y apúntalo aquí.</T>
        ) : (
          history.map((h) => (
            <Pressable key={h.id} onPress={() => setEditing(h)} style={({ pressed }) => [s.histRow, pressed && { opacity: 0.6 }]}>
              <View style={s.flex}>
                <T style={s.histTitle}>{sportLabel(h.sport)}</T>
                <T v="label" dim>
                  {summary(h) || 'Sin datos'}
                </T>
              </View>
              <T v="label" dim>
                {dateLabel(h.date)}
              </T>
            </Pressable>
          ))
        )}
      </Card>

      {editing && (
        <SessionSheet
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={saveSession}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  setSessions(sessions.filter((x) => x.id !== editing.id));
                  setEditing(null);
                }
          }
        />
      )}
      <WeekSheet visible={planning} plan={plan} onChange={setWeek} onClose={() => setPlanning(false)} />
    </Screen>
  );
}

function WeekSheet({
  visible,
  plan,
  onChange,
  onClose,
}: {
  visible: boolean;
  plan: DayPlan[];
  onChange: (p: DayPlan[]) => void;
  onClose: () => void;
}) {
  const edit = (i: number, patch: Partial<DayPlan>) => onChange(plan.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <Sheet visible={visible} onClose={onClose}>
      <T v="h">Semana tipo</T>
      <T v="label" dim>
        Se repite cada semana. Cámbiala cuando cambies de rutina.
      </T>
      {plan.map((d, i) => (
        <View key={d.day} style={s.weekDay}>
          <Field label={d.day} value={d.name} onChangeText={(name) => edit(i, { name })} placeholder={PLACEHOLDERS[i]} />
          <Field label="Notas" value={d.notes} onChangeText={(notes) => edit(i, { notes })} placeholder="Ritmo, series, distancia…" />
        </View>
      ))}
      <Button title="Listo" onPress={onClose} />
    </Sheet>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  day: { width: 36 },
  flex: { flex: 1 },
  recRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  histTitle: { fontFamily: Font.bold, fontSize: 14 },
  weekDay: { gap: 8 },
});
