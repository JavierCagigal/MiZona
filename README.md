# MiZona

App de nutrición y actividad: macros, comidas, peso, agua y tu semana de entrenos
(carrera, bici, natación, fuerza…). Hecha con Expo, así que el mismo código sirve
para iOS, Android y web.

De momento todo se guarda en el propio dispositivo: no hay cuenta ni servidor.
Las cuentas y la sincronización llegan en la fase 2.

## Probarla

```bash
npm install
npx expo start
```

- **En tu iPhone:** instala **Expo Go** desde la App Store y escanea el QR que
  aparece en la terminal (el móvil y el Mac tienen que estar en la misma wifi).
- **En el navegador:** pulsa `w` en la terminal.

## Comprobaciones

```bash
npm run check      # lógica de macros y fechas
npx tsc --noEmit   # tipos
npx expo lint      # estilo
```

## Estructura

```
src/app/          pantallas: index (Hoy), comidas, actividad, ajustes (Perfil)
src/components/   barra de pestañas y piezas de interfaz (tarjetas, botones, hojas)
src/lib/          macros, fechas, guardado local y búsqueda en Open Food Facts
src/constants/    colores (modo claro y oscuro) y tipografía
```

## Fases

1. **Mejorar la app** (ahora): rediseño y funciones sin servidor.
2. **Producción:** cuentas, nube, Apple Health, escáner, foto con IA y App Store.
3. **Crecer:** parte social y suscripción.

La versión anterior (la PWA en JavaScript puro) sigue en la rama `main`.
