import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Input, Sheet, T } from '@/components/ui';
import { useColors } from '@/constants/theme';
import { lookupBarcode } from '@/lib/food-api';
import { Food } from '@/lib/macros';

type Status = { kind: 'scanning' } | { kind: 'looking'; code: string } | { kind: 'missing' | 'error'; code: string };

/** Lee el código de barras con la cámara (o a mano) y busca el producto en Open Food Facts. */
export function BarcodeSheet({
  onClose,
  onFound,
  onCreate,
}: {
  onClose: () => void;
  onFound: (food: Food) => void;
  onCreate: () => void;
}) {
  const c = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>({ kind: 'scanning' });
  const [typed, setTyped] = useState('');

  const look = async (raw: string) => {
    const code = raw.replace(/\D/g, '');
    if (code.length < 8) return;
    setStatus({ kind: 'looking', code });
    try {
      const food = await lookupBarcode(code);
      if (food) onFound(food);
      else setStatus({ kind: 'missing', code });
    } catch {
      setStatus({ kind: 'error', code });
    }
  };

  return (
    <Sheet visible onClose={onClose}>
      <T v="h">Escanear código de barras</T>

      {!permission ? null : permission.granted ? (
        status.kind === 'scanning' ? (
          <View style={s.camera}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={({ data }) => look(data)}
            />
            <View style={[s.frame, { borderColor: c.card }]} pointerEvents="none" />
          </View>
        ) : null
      ) : (
        <View style={s.block}>
          <T dim>Para leer el código hace falta permiso para usar la cámara.</T>
          {permission.canAskAgain ? (
            <Button title="Permitir cámara" onPress={requestPermission} />
          ) : (
            <T v="label" dim>
              Lo bloqueaste antes: actívalo en los ajustes del navegador o del móvil, o escribe el código abajo.
            </T>
          )}
        </View>
      )}

      {status.kind === 'scanning' && permission?.granted && (
        <T v="label" dim style={s.center}>
          Apunta al código. Se lee solo.
        </T>
      )}
      {status.kind === 'looking' && <T dim>Buscando {status.code}…</T>}
      {(status.kind === 'missing' || status.kind === 'error') && (
        <View style={s.block}>
          <T>
            {status.kind === 'missing'
              ? `El código ${status.code} no está en Open Food Facts o no tiene calorías.`
              : 'No se pudo consultar Open Food Facts (sin conexión o no responde).'}
          </T>
          {status.kind === 'missing' ? (
            <Button title="Crear el alimento a mano" onPress={onCreate} />
          ) : (
            <Button title="Reintentar" onPress={() => look(status.code)} />
          )}
          <Button title="Escanear otro" kind="outline" onPress={() => setStatus({ kind: 'scanning' })} />
        </View>
      )}

      <T v="label" dim>
        ¿No lo lee? Escribe los números del código
      </T>
      <View style={s.row}>
        <Input
          value={typed}
          onChangeText={setTyped}
          keyboardType="number-pad"
          placeholder="8410000000000"
          style={s.flex}
          accessibilityLabel="Código de barras"
        />
        <Button title="Buscar" small onPress={() => look(typed)} />
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  camera: { height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  frame: { position: 'absolute', left: '12%', right: '12%', top: '35%', bottom: '35%', borderWidth: 2, borderRadius: 12 },
  block: { gap: 10 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
});
