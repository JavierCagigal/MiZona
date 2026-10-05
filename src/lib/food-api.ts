// Open Food Facts: API pública y gratuita, sin clave. https://openfoodfacts.github.io/openfoodfacts-server/api/
// ponytail: buena para productos de marca, floja para básicos (arroz, pechuga). Añadir BEDCA cuando toque.
import type { Food } from './macros';

/** null = fallo de red, distinto de "sin resultados" ([]). */
export async function searchOpenFoodFacts(query: string): Promise<Food[] | null> {
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?' +
    new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'code,product_name,brands,nutriments',
    });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open Food Facts respondió ${res.status}`);
    const data = await res.json();
    return (data.products ?? [])
      .filter((p: any) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
      .map((p: any) => ({
        id: `off_${p.code}`,
        source: 'off',
        name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
        kcal100: round1(p.nutriments['energy-kcal_100g']),
        protein100: round1(p.nutriments.proteins_100g ?? 0),
        carbs100: round1(p.nutriments.carbohydrates_100g ?? 0),
        fat100: round1(p.nutriments.fat_100g ?? 0),
      }));
  } catch (e) {
    console.error('Error buscando en Open Food Facts', e);
    return null;
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
