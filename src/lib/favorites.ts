import { Food } from './macros';
import { useStored } from './store';

export function useFavorites() {
  const [favs, setFavs] = useStored<Food[]>('favs', []);
  const isFav = (f: Food) => favs.some((x) => x.id === f.id);
  const toggle = (f: Food) => setFavs(isFav(f) ? favs.filter((x) => x.id !== f.id) : [f, ...favs]);
  return { favs, isFav, toggle };
}
