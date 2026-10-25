import AsyncStorage from '@react-native-async-storage/async-storage';

export type BestGame = 'bubbles' | 'coral';
const keyFor = (game: BestGame) => `@memopal/companion-games/best/v1/${game}`;

/** Optional, device-only play score. A storage failure never interrupts a game. */
export async function readGameBest(game: BestGame): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(game));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  } catch { return null; }
}

export async function saveGameBest(game: BestGame, score: number): Promise<number | null> {
  if (!Number.isSafeInteger(score) || score < 0) return null;
  try {
    const raw = await AsyncStorage.getItem(keyFor(game));
    const parsed = raw === null ? null : Number(raw);
    const previous = parsed !== null && Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
    const best = Math.max(previous ?? 0, score);
    await AsyncStorage.setItem(keyFor(game), String(best));
    return best;
  } catch { return null; }
}
