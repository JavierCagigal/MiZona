import { router } from 'expo-router';
import { useState } from 'react';
import { Share } from 'react-native';

import { ProfileForm } from '@/components/profile-form';
import { Button, Card, Input, Screen, Sheet, T } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { exportAll, importAll } from '@/lib/backup';
import { Profile } from '@/lib/macros';
import { useStored } from '@/lib/store';

export default function Ajustes() {
  const c = useColors();
  const [profile, setProfile, loaded, loads] = useStored<Profile | null>('profile', null);
  const [sheet, setSheet] = useState<{ mode: 'export' | 'import'; text: string } | null>(null);

  const exportBackup = async () => {
    const text = await exportAll();
    try {
      await Share.share({ title: 'Copia de MiZona', message: text });
    } catch {
      // Sin hoja de compartir (p. ej. navegador de escritorio): se muestra el texto para copiarlo a mano.
      setSheet({ mode: 'export', text });
    }
  };

  return (
    <Screen>
      <T v="title">Perfil</T>
      {loaded && (
        <ProfileForm
          key={loads}
          initial={profile}
          onSave={(p) => {
            setProfile(p);
            if (!profile) router.navigate('/');
          }}
        />
      )}

      <Card bg={c.water}>
        <T v="h">Copia de seguridad</T>
        <T v="label" dim>
          Tus datos solo están en este dispositivo. Exporta una copia de vez en cuando (a Notas, Archivos o tu correo) y
          restáurala si cambias de móvil.
        </T>
        <Button title="Exportar copia" onPress={exportBackup} />
        <Button title="Restaurar copia" kind="outline" onPress={() => setSheet({ mode: 'import', text: '' })} />
      </Card>

      {sheet && <BackupSheet {...sheet} onClose={() => setSheet(null)} />}
    </Screen>
  );
}

function BackupSheet({ mode, text, onClose }: { mode: 'export' | 'import'; text: string; onClose: () => void }) {
  const c = useColors();
  const [value, setValue] = useState(text);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const restore = async () => {
    if (!confirming) return setConfirming(true);
    try {
      const n = await importAll(value);
      setMessage({ ok: true, text: `Copia restaurada (${n} datos).` });
      setTimeout(() => {
        onClose();
        router.navigate('/');
      }, 1200);
    } catch (e) {
      setConfirming(false);
      setMessage({ ok: false, text: (e as Error).message });
    }
  };

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">{mode === 'export' ? 'Tu copia' : 'Restaurar copia'}</T>
      <T v="label" dim>
        {mode === 'export'
          ? 'Selecciona todo el texto, cópialo y guárdalo donde quieras.'
          : 'Pega el texto completo de tu copia. Se sustituirán los datos que contenga; lo demás no se toca.'}
      </T>
      <Input
        value={value}
        onChangeText={setValue}
        editable={mode === 'import'}
        multiline
        selectTextOnFocus={mode === 'export'}
        placeholder='{"app":"mizona", …}'
        style={{ minHeight: 160, maxHeight: 260, fontSize: 12 }}
      />
      {message && (
        <T v="label" style={{ color: message.ok ? c.activityInk : c.danger }}>
          {message.text}
        </T>
      )}
      {mode === 'import' && (
        <Button title={confirming ? 'Toca otra vez para confirmar' : 'Restaurar'} kind={confirming ? 'danger' : 'solid'} onPress={restore} />
      )}
    </Sheet>
  );
}
