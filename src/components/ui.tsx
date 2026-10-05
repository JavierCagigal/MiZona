import { Children, ReactNode, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, useColors } from '@/constants/theme';

/** Pantalla con scroll. Cada bloque entra con un pequeño fundido escalonado (respeta "Reducir movimiento"). */
export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[s.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
      keyboardShouldPersistTaps="handled">
      {Children.map(
        children,
        (child, i) =>
          child && <Animated.View entering={FadeInDown.delay(Math.min(i, 8) * 45).duration(320)}>{child}</Animated.View>
      )}
    </ScrollView>
  );
}

type Variant = 'title' | 'h' | 'num' | 'big' | 'label' | 'body';

export function T({ v = 'body', dim, style, ...props }: TextProps & { v?: Variant; dim?: boolean }) {
  const c = useColors();
  return <Text {...props} style={[s[v], { color: dim ? c.dim : c.text }, style]} />;
}

export function Card({
  bg,
  style,
  onPress,
  children,
}: {
  bg?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  children: ReactNode;
}) {
  const c = useColors();
  const base = [s.card, { backgroundColor: bg ?? c.card }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && s.pressedCard]}>
      {children}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'solid',
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'solid' | 'outline' | 'danger';
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const fg = kind === 'solid' ? c.btnText : kind === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        kind === 'solid' ? { backgroundColor: c.btn } : { borderWidth: 1.5, borderColor: fg },
        pressed && s.pressed,
        style,
      ]}>
      <Text style={[s.btnText, small && s.btnTextSmall, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  const c = useColors();
  return (
    <TextInput placeholderTextColor={c.dim} {...props} style={[s.input, { backgroundColor: c.bg, color: c.text }, style]} />
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <T v="label" dim>
        {label}
      </T>
      <Input {...props} />
    </View>
  );
}

export function Segmented<V extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  const c = useColors();
  return (
    <View style={s.seg}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[s.segBtn, { backgroundColor: on ? c.btn : c.bg }]}>
            <Text style={[s.segText, { color: on ? c.btnText : c.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barra de progreso que se rellena con animación. */
export function Bar({ pct, color, track }: { pct: number; color: string; track: string }) {
  const target = Math.min(100, Math.max(0, pct || 0));
  const width = useSharedValue(0);
  useEffect(() => {
    width.set(withTiming(target, { duration: 700 }));
  }, [target, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.get()}%` }));
  return (
    <View style={[s.track, { backgroundColor: track }]}>
      <Animated.View style={[s.fill, { backgroundColor: color }, fill]} />
    </View>
  );
}

/** Hoja que sube desde abajo, con scroll si el contenido es largo. Se cierra tocando fuera. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[s.sheet, { backgroundColor: c.card }]}>
          <View style={[s.grabber, { backgroundColor: c.line }]} />
          <ScrollView
            style={s.sheetScroll}
            contentContainerStyle={[s.sheetBody, { paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { paddingHorizontal: 14, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { fontFamily: Font.bold, fontSize: 34, letterSpacing: -1 },
  h: { fontFamily: Font.bold, fontSize: 18, letterSpacing: -0.4 },
  num: { fontFamily: Font.bold, fontSize: 20, fontVariant: ['tabular-nums'] },
  big: { fontFamily: Font.bold, fontSize: 40, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  label: { fontFamily: Font.regular, fontSize: 12 },
  body: { fontSize: 15, lineHeight: 21 },
  card: { borderRadius: 26, padding: 16, gap: 10 },
  pressed: { opacity: 0.7 },
  pressedCard: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  btn: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  btnText: { fontFamily: Font.bold, fontSize: 14 },
  btnTextSmall: { fontSize: 12 },
  field: { gap: 6 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  segText: { fontFamily: Font.bold, fontSize: 13 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingTop: 8 },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center' },
  sheetScroll: { flexGrow: 0 },
  sheetBody: { padding: 20, gap: 14 },
});
