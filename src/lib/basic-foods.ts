// Alimentos básicos que Open Food Facts no cubre bien. Valores de referencia aproximados por 100 g de parte
// comestible (carbohidratos = disponibles, sin fibra), tomados de tablas de composición habituales.
// ponytail: lista curada a mano. Antes de lanzar, cotejar con BEDCA (bedca.net) y citar la fuente en la app.
import type { Food } from './macros';

// [nombre, kcal, proteína, carbos, grasa]
const RAW: [string, number, number, number, number][] = [
  // Cereales, pan y tubérculos
  ['Arroz blanco (crudo)', 360, 6.7, 79, 0.6],
  ['Arroz blanco (cocido)', 130, 2.7, 28, 0.3],
  ['Arroz integral (cocido)', 112, 2.6, 23, 0.9],
  ['Pasta (cruda)', 360, 12.5, 72, 1.5],
  ['Pasta (cocida)', 158, 5.8, 31, 0.9],
  ['Pan blanco (barra)', 270, 9, 53, 2],
  ['Pan integral', 247, 13, 41, 3.4],
  ['Pan de molde', 265, 8, 49, 3.5],
  ['Copos de avena', 372, 13.5, 59, 7],
  ['Quinoa (cocida)', 120, 4.4, 21, 1.9],
  ['Cuscús (cocido)', 112, 3.8, 23, 0.2],
  ['Tortitas de arroz', 387, 8, 81, 2.8],
  ['Copos de maíz (cereales)', 357, 7.5, 84, 0.4],
  ['Harina de trigo', 364, 10, 76, 1],
  ['Patata (cruda)', 77, 2, 17, 0.1],
  ['Patata (cocida)', 87, 1.9, 20, 0.1],
  ['Boniato (asado)', 90, 2, 21, 0.2],
  // Legumbres
  ['Lentejas (cocidas)', 116, 9, 20, 0.4],
  ['Garbanzos (cocidos)', 164, 8.9, 27, 2.6],
  ['Alubias blancas (cocidas)', 139, 9.7, 25, 0.4],
  ['Guisantes', 81, 5.4, 9.5, 0.4],
  ['Hummus', 166, 7.9, 8.6, 9.6],
  ['Tofu', 125, 13, 1.5, 7.5],
  // Carnes
  ['Pechuga de pollo (cruda)', 120, 22.5, 0, 2.6],
  ['Pechuga de pollo (a la plancha)', 165, 31, 0, 3.6],
  ['Muslo de pollo sin piel (asado)', 180, 25, 0, 8],
  ['Pechuga de pavo (fiambre)', 104, 18, 3, 2],
  ['Ternera magra (cruda)', 131, 21, 0, 5],
  ['Carne picada de ternera (15% grasa)', 215, 18.6, 0, 15],
  ['Lomo de cerdo (crudo)', 143, 21, 0, 6.3],
  ['Jamón serrano', 241, 30.5, 0.5, 13],
  ['Jamón cocido', 115, 18, 1.5, 4],
  ['Chorizo', 455, 24, 2, 39],
  // Pescados y marisco
  ['Salmón (crudo)', 208, 20, 0, 13],
  ['Merluza (cruda)', 75, 16.5, 0, 1],
  ['Bacalao fresco (crudo)', 82, 18, 0, 0.7],
  ['Atún en lata al natural', 116, 26, 0, 1],
  ['Atún en aceite (escurrido)', 198, 29, 0, 8.2],
  ['Sardinas en aceite (escurridas)', 208, 25, 0, 11.5],
  ['Gambas / langostinos (cocidos)', 99, 24, 0.2, 0.3],
  // Huevos y lácteos
  ['Huevo', 143, 12.6, 0.7, 9.5],
  ['Clara de huevo', 52, 11, 0.7, 0.2],
  ['Leche entera', 64, 3.2, 4.7, 3.6],
  ['Leche semidesnatada', 46, 3.2, 4.8, 1.6],
  ['Leche desnatada', 35, 3.4, 4.9, 0.1],
  ['Yogur natural', 62, 3.8, 4.7, 3.2],
  ['Yogur griego', 133, 3.6, 4.4, 11],
  ['Skyr natural', 63, 11, 4, 0.2],
  ['Queso fresco (tipo Burgos)', 174, 12.4, 3, 12.6],
  ['Queso fresco batido 0%', 46, 8, 3.5, 0.2],
  ['Queso curado', 404, 26, 0.5, 33],
  ['Mozzarella', 254, 18, 2, 19.5],
  ['Mantequilla', 717, 0.9, 0.1, 81],
  ['Bebida de avena', 46, 1, 6.7, 1.5],
  ['Bebida de soja (sin azúcar)', 33, 3.3, 0.7, 1.8],
  // Frutas
  ['Plátano', 90, 1.1, 21, 0.3],
  ['Manzana', 52, 0.3, 12, 0.2],
  ['Naranja', 45, 0.9, 9.5, 0.2],
  ['Pera', 57, 0.4, 12, 0.1],
  ['Fresas', 32, 0.7, 6, 0.3],
  ['Uvas', 69, 0.7, 16, 0.2],
  ['Kiwi', 61, 1.1, 12, 0.5],
  ['Melón', 34, 0.8, 8, 0.2],
  ['Sandía', 30, 0.6, 7.5, 0.2],
  ['Piña', 50, 0.5, 12, 0.1],
  ['Arándanos', 57, 0.7, 12, 0.3],
  ['Aguacate', 160, 2, 1.8, 14.7],
  ['Dátiles', 282, 2.5, 67, 0.4],
  ['Pasas', 299, 3, 75, 0.5],
  // Verduras
  ['Tomate', 18, 0.9, 2.6, 0.2],
  ['Lechuga', 15, 1.4, 1.5, 0.2],
  ['Espinacas', 23, 2.9, 1.4, 0.4],
  ['Brócoli', 34, 2.8, 4.4, 0.4],
  ['Zanahoria', 41, 0.9, 7, 0.2],
  ['Cebolla', 40, 1.1, 7.6, 0.1],
  ['Pimiento rojo', 31, 1, 4.2, 0.3],
  ['Calabacín', 17, 1.2, 2.1, 0.3],
  ['Pepino', 15, 0.7, 3.1, 0.1],
  ['Champiñones', 22, 3.1, 2.3, 0.3],
  ['Judías verdes', 31, 1.8, 4.3, 0.2],
  ['Berenjena', 25, 1, 2.9, 0.2],
  ['Maíz dulce (lata)', 80, 2.7, 15, 1.2],
  ['Gazpacho', 41, 0.8, 3.6, 2.6],
  // Grasas, frutos secos y otros
  ['Aceite de oliva', 884, 0, 0, 100],
  ['Aceitunas', 145, 1, 0.5, 15],
  ['Almendras', 579, 21, 9.1, 50],
  ['Nueces', 654, 15, 7, 65],
  ['Cacahuetes', 567, 26, 7.6, 49],
  ['Crema de cacahuete', 588, 25, 14, 50],
  ['Anacardos', 553, 18, 27, 44],
  ['Pipas de girasol (peladas)', 584, 21, 11, 51],
  ['Chocolate negro 70%', 598, 7.8, 34, 43],
  ['Miel', 304, 0.3, 82, 0],
  ['Azúcar', 400, 0, 100, 0],
  ['Mermelada', 250, 0.4, 62, 0.1],
  // Platos y bebidas
  ['Tortilla de patatas', 165, 6, 13, 10],
  ['Pizza margarita', 260, 11, 32, 10],
  ['Cerveza', 43, 0.5, 3.6, 0],
  ['Vino tinto', 85, 0.1, 2.6, 0],
  // Deporte
  ['Proteína de suero (whey)', 380, 75, 8, 6],
  ['Bebida isotónica', 26, 0, 6.5, 0],
  ['Gel energético (media)', 260, 0, 64, 0],
  ['Barrita energética (media)', 400, 8, 64, 12],
];

/** Minúsculas y sin tildes, para que "platano" encuentre "Plátano". */
export function norm(s: string) {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export const BASIC_FOODS: Food[] = RAW.map(([name, kcal100, protein100, carbs100, fat100]) => ({
  id: `basic_${norm(name).replace(/[^a-z0-9]+/g, '-')}`,
  source: 'basic',
  name,
  kcal100,
  protein100,
  carbs100,
  fat100,
}));

/** Busca en lo tuyo y en los básicos. Todas las palabras tienen que aparecer; primero lo que empieza igual. */
export function searchLocal(query: string, own: Food[]) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const matches = (f: Food) => words.every((w) => norm(f.name).includes(w));
  const starts = (f: Food) => (norm(f.name).startsWith(words[0]) ? 0 : 1);
  return [...own.filter(matches), ...BASIC_FOODS.filter(matches).sort((a, b) => starts(a) - starts(b))].slice(0, 15);
}
