// Gráficas en SVG. Una sola serie por gráfica, rejilla fina, ejes con números redondos.
// Tocar una barra o un punto lo selecciona; el valor se muestra fuera, encima de la gráfica.
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Font, useColors } from '@/constants/theme';
import { niceTicks, shortNumber } from '@/lib/charts';
import { DAY_NAMES, fromKey, isoDayIndex } from '@/lib/dates';

const PAD = { left: 34, right: 8, top: 14, bottom: 22 };

type Props = {
  days: string[];
  values: (number | null)[];
  width: number;
  height?: number;
  selected: number | null;
  onSelect: (i: number) => void;
};

function shortDate(key: string) {
  return fromKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** Etiquetas del eje X: inicial del día si son 7; si no, primera, mitad y última fecha. */
function XLabels({ days, x, y }: { days: string[]; x: (i: number) => number; y: number }) {
  const c = useColors();
  const n = days.length;
  const marks =
    n <= 7
      ? days.map((d, i) => ({ i, text: DAY_NAMES[isoDayIndex(fromKey(d))][0], anchor: 'middle' as const }))
      : [
          { i: 0, text: shortDate(days[0]), anchor: 'start' as const },
          { i: Math.floor((n - 1) / 2), text: shortDate(days[Math.floor((n - 1) / 2)]), anchor: 'middle' as const },
          { i: n - 1, text: shortDate(days[n - 1]), anchor: 'end' as const },
        ];
  return (
    <G>
      {marks.map((m) => (
        <SvgText key={m.i} x={x(m.i)} y={y} fontSize={10} fontFamily={Font.regular} fill={c.dim} textAnchor={m.anchor}>
          {m.text}
        </SvgText>
      ))}
    </G>
  );
}

function YGrid({ ticks, y, width }: { ticks: number[]; y: (v: number) => number; width: number }) {
  const c = useColors();
  return (
    <G>
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={c.line} strokeWidth={1} />
          <SvgText x={PAD.left - 6} y={y(t) + 3} fontSize={10} fontFamily={Font.regular} fill={c.dim} textAnchor="end">
            {shortNumber(t)}
          </SvgText>
        </G>
      ))}
    </G>
  );
}

/** Zonas táctiles: una franja vertical por día, más ancha que la marca. */
function HitSlots({ n, width, height, onSelect }: { n: number; width: number; height: number; onSelect: (i: number) => void }) {
  const slot = (width - PAD.left - PAD.right) / n;
  return (
    <G>
      {Array.from({ length: n }, (_, i) => (
        <Rect
          key={i}
          x={PAD.left + i * slot}
          y={0}
          width={slot}
          height={height}
          fill="#000"
          fillOpacity={0}
          onPress={() => onSelect(i)}
        />
      ))}
    </G>
  );
}

/** Columnas por día con una línea de objetivo. Por encima del objetivo, otro color (y la línea lo marca). */
export function CaloriesChart({ days, values, goal, width, height = 190, selected, onSelect }: Props & { goal: number }) {
  const c = useColors();
  const n = days.length;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const ticks = niceTicks(0, Math.max(goal * 1.15, ...values.map((v) => v ?? 0)));
  const yMax = ticks.at(-1)!;
  const y = (v: number) => PAD.top + plotH * (1 - v / yMax);
  const slot = plotW / n;
  const barW = Math.max(1, Math.min(24, slot - 2));
  const cx = (i: number) => PAD.left + i * slot + slot / 2;
  const base = y(0);

  return (
    <Svg width={width} height={height}>
      <YGrid ticks={ticks} y={y} width={width} />
      {values.map((v, i) => {
        if (v == null || v <= 0) return null;
        const top = y(v);
        const r = Math.min(4, barW / 2, base - top);
        const x0 = cx(i) - barW / 2;
        const x1 = x0 + barW;
        return (
          <Path
            key={days[i]}
            d={`M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z`}
            fill={v > goal ? c.chartOver : c.chartOk}
          />
        );
      })}
      {selected != null && values[selected] != null && (
        <Circle cx={cx(selected)} cy={y(values[selected]!) - 8} r={3.5} fill={c.text} />
      )}
      <Line x1={PAD.left} x2={width - PAD.right} y1={y(goal)} y2={y(goal)} stroke={c.text} strokeWidth={1.5} />
      {/* Fondo para que la etiqueta se lea aunque haya barras detrás */}
      <Rect x={width - PAD.right - 92} y={y(goal) - 17} width={92} height={14} rx={4} fill={c.card} fillOpacity={0.9} />
      <SvgText
        x={width - PAD.right - 4}
        y={y(goal) - 6}
        fontSize={10}
        fontFamily={Font.bold}
        fill={c.text}
        textAnchor="end">
        {`Objetivo ${goal}`}
      </SvgText>
      <XLabels days={days} x={cx} y={height - 6} />
      <HitSlots n={n} width={width} height={height} onSelect={onSelect} />
    </Svg>
  );
}

/** Línea de peso con un velo suave debajo, el último valor marcado y el punto elegido con su guía vertical. */
export function WeightChart({ days, values, width, height = 170, selected, onSelect, color }: Props & { color: string }) {
  const c = useColors();
  const n = days.length;
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const known = values.flatMap((v, i) => (v == null ? [] : [{ i, v }]));
  const ticks = niceTicks(Math.min(...known.map((p) => p.v)) - 0.3, Math.max(...known.map((p) => p.v)) + 0.3, 3);
  const y = (v: number) => PAD.top + plotH * (1 - (v - ticks[0]) / (ticks.at(-1)! - ticks[0]));
  const x = (i: number) => PAD.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const line = known.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.v)}`).join(' ');
  const area = `${line} L${x(known.at(-1)!.i)},${y(ticks[0])} L${x(known[0].i)},${y(ticks[0])} Z`;
  const last = known.at(-1)!;
  const sel = selected != null && values[selected] != null ? { i: selected, v: values[selected]! } : null;

  return (
    <Svg width={width} height={height}>
      <YGrid ticks={ticks} y={y} width={width} />
      <Path d={area} fill={color} fillOpacity={0.1} />
      <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {sel && <Line x1={x(sel.i)} x2={x(sel.i)} y1={PAD.top} y2={y(ticks[0])} stroke={c.dim} strokeWidth={1} />}
      {[last, ...(sel && sel.i !== last.i ? [sel] : [])].map((p) => (
        <Circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={4.5} fill={color} stroke={c.card} strokeWidth={2} />
      ))}
      <XLabels days={days} x={x} y={height - 6} />
      <HitSlots
        n={n}
        width={width}
        height={height}
        onSelect={(i) => {
          // Salta al día con peso más cercano al que se ha tocado
          const nearest = known.reduce((a, b) => (Math.abs(b.i - i) < Math.abs(a.i - i) ? b : a));
          onSelect(nearest.i);
        }}
      />
    </Svg>
  );
}
