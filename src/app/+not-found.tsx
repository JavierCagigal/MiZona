import { Redirect } from 'expo-router';

// Cualquier ruta desconocida (p. ej. el antiguo acceso directo a /index.html) lleva a Hoy.
export default function NotFound() {
  return <Redirect href="/" />;
}
