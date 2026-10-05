// Copia de seguridad como texto JSON: se comparte (Notas, Archivos, correo…) y se restaura pegándolo.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KNOWN =
  /^(profile|foods|recent|favs|week|weights|water|measures|sessions|(log|done):\d{4}-\d{2}-\d{2})$/;

export async function exportAll() {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => KNOWN.test(k));
  const rows = await AsyncStorage.multiGet(keys);
  return JSON.stringify({ app: 'mizona', version: 1, exportedAt: new Date().toISOString(), data: Object.fromEntries(rows) });
}

/** Restaura una copia. Sustituye lo que venga en ella y deja intacto lo demás. Devuelve cuántos datos restauró. */
export async function importAll(text: string) {
  const invalid = new Error('Ese texto no es una copia de MiZona. Pega el texto completo que exportaste.');
  let parsed: any;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw invalid;
  }
  if (parsed?.app !== 'mizona' || typeof parsed.data !== 'object' || parsed.data === null) throw invalid;

  const rows = Object.entries(parsed.data).filter(
    (row): row is [string, string] => KNOWN.test(row[0]) && typeof row[1] === 'string'
  );
  try {
    rows.forEach(([, v]) => JSON.parse(v));
  } catch {
    throw invalid;
  }
  await AsyncStorage.multiSet(rows);
  return rows.length;
}
