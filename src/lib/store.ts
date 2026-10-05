// Todo vive en el dispositivo (AsyncStorage; en web, localStorage). Sin cuenta ni servidor hasta la fase 2.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

// Claves: 'profile', 'foods', 'recent', 'week', 'weights', 'water', `log:${día}`, `done:${día}`

function parse<T>(raw: string | null, fallback: T): T {
  try {
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    console.error('Dato corrupto, uso el valor por defecto', e);
    return fallback;
  }
}

export async function load<T>(key: string, fallback: T): Promise<T> {
  return parse(await AsyncStorage.getItem(key), fallback);
}

export async function loadMany<T>(keys: string[], fallback: T): Promise<T[]> {
  const rows = await AsyncStorage.multiGet(keys);
  return rows.map(([, raw]) => parse(raw, fallback));
}

export function save(key: string, value: unknown) {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch((e) => console.error('Error guardando', key, e));
}

/** Estado persistido que se recarga cada vez que la pantalla gana el foco. */
export function useStored<T>(key: string, fallback: T) {
  const [state, setState] = useState({ key: '', value: fallback, loads: 0 });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      load(key, fallback).then((value) => alive && setState((s) => ({ key, value, loads: s.loads + 1 })));
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- el fallback es un literal nuevo en cada render
    }, [key])
  );

  const loaded = state.key === key;
  const value = loaded ? state.value : fallback;
  const set = (v: T) => {
    setState((s) => ({ ...s, key, value: v }));
    save(key, v);
  };
  // `loads` cambia cada vez que se relee del disco: sirve de `key` para formularios que copian el valor.
  return [value, set, loaded, state.loads] as const;
}
