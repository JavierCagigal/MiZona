import { TabList, TabListProps, TabSlot, TabTrigger, TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, useColors } from '@/constants/theme';

const TABS = [
  { name: 'index', href: '/', label: 'Hoy' },
  { name: 'comidas', href: '/comidas', label: 'Comidas' },
  { name: 'actividad', href: '/actividad', label: 'Actividad' },
  { name: 'progreso', href: '/progreso', label: 'Progreso' },
  { name: 'ajustes', href: '/ajustes', label: 'Perfil' },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <Bar>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton>{t.label}</TabButton>
            </TabTrigger>
          ))}
        </Bar>
      </TabList>
    </Tabs>
  );
}

function Bar(props: TabListProps) {
  const c = useColors();
  return (
    <View {...props} style={s.wrap}>
      <View style={[s.bar, { backgroundColor: c.card, borderColor: c.line }]}>{props.children}</View>
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const c = useColors();
  return (
    <Pressable {...props} style={[s.tab, isFocused && { backgroundColor: c.btn }]}>
      <Text style={[s.label, { color: isFocused ? c.btnText : c.dim }]}>{children}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 0, width: '100%', padding: 10, alignItems: 'center' },
  bar: { flexDirection: 'row', gap: 2, padding: 4, borderRadius: 999, borderWidth: 1, width: '100%', maxWidth: 460 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 999 },
  label: { fontFamily: Font.bold, fontSize: 11 },
});
