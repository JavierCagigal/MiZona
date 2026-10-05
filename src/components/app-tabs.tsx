import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/constants/theme';

// ponytail: iconos SF Symbols solo en iOS; Android muestra la etiqueta. Añadir drawables al preparar Google Play.
export default function AppTabs() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.text} labelStyle={{ selected: { color: c.text } }} indicatorColor={c.line}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sun.max.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="comidas">
        <NativeTabs.Trigger.Label>Comidas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fork.knife" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="actividad">
        <NativeTabs.Trigger.Label>Actividad</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="figure.run" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="progreso">
        <NativeTabs.Trigger.Label>Progreso</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
