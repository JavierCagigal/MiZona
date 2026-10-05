// Estilo bento: fondo neutro, tarjetas pastel por área (las mismas del mapa de la app) y tipografía mono.
import { useColorScheme } from '@/hooks/use-color-scheme';

const light = {
  bg: '#E9E7E2',
  card: '#F7F5F0',
  text: '#1D1C1A',
  dim: '#77736B',
  line: '#DCD8D0',
  btn: '#1D1C1A',
  btnText: '#F7F5F0',
  food: '#F6DCC4',
  weight: '#F0D58E',
  weightInk: '#B88A1C',
  activity: '#D5E6C4',
  activityInk: '#5E8A44',
  water: '#CFE0F3',
  waterInk: '#4A8FD6',
  profile: '#DDD6F0',
  danger: '#C1573E',
};

const dark: typeof light = {
  bg: '#121211',
  card: '#1F1E1C',
  text: '#ECEBE6',
  dim: '#9A978F',
  line: '#33322F',
  btn: '#ECEBE6',
  btnText: '#121211',
  food: '#3A2C20',
  weight: '#3A3218',
  weightInk: '#E0B954',
  activity: '#24301D',
  activityInk: '#9CC27D',
  water: '#1C2A38',
  waterInk: '#6FAEEA',
  profile: '#2A253A',
  danger: '#E07A5F',
};

export type Palette = typeof light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const Font = { regular: 'SpaceMono_400Regular', bold: 'SpaceMono_700Bold' };
