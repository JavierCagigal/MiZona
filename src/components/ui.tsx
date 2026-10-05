import { ReactNode } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, useColors } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[s.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
      keyboardShouldPersistTaps="handled">
      {children}
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
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && s.pressed]}>
      {children}
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  kind = 'solid',
  style,
}: {
  title: string;
  onPress: () => void;
  kind?: 'solid' | 'outline' | 'danger';
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
        kind === 'solid' ? { backgroundColor: c.btn } : { borderWidth: 1.5, borderColor: fg },
        pressed && s.pressed,
        style,
      ]}>
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={s.field}>
      <T v="label" dim>
        {label}
      </T>
      <TextInput
        placeholderTextColor={c.dim}
        {...props}
        style={[s.input, { backgroundColor: c.bg, color: c.text }, style]}
      />
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

export function Bar({ pct, color, track }: { pct: number; color: string; track: string }) {
  return (
    <View style={[s.track, { backgroundColor: track }]}>
      <View style={[s.fill, { backgroundColor: color, width: `${Math.min(100, Math.max(0, pct))}%` }]} />
    </View>
  );
}

/** Hoja que sube desde abajo. Se cierra tocando fuera. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[s.sheet, { backgroundColor: c.card, paddingBottom: insets.bottom + 20 }]}>{children}</View>
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
  pressed: { opacity: 0.75 },
  btn: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  btnText: { fontFamily: Font.bold, fontSize: 14 },
  field: { gap: 6 },
  input: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  segText: { fontFamily: Font.bold, fontSize: 13 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14, maxHeight: '90%' },
});
