import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PracticeResponseInput } from '@/features/practice-attempts';

export type PalaceSessionMode = 'browse' | 'walk' | 'recall';

export type PalaceSessionSnapshot = {
  memorySetId: string;
  memorySetVersion: number;
  mode: PalaceSessionMode;
  activeIndex: number;
  score: number;
  clientAttemptId: string;
  startedAt: string;
  startedAtMs: number;
  questionStartedAtMs: number;
  responses: PracticeResponseInput[];
  savedAt: string;
};

const SESSION_KEY_PREFIX = 'memopal:palace-session:';

function getKey(memorySetId: string) {
  return `${SESSION_KEY_PREFIX}${memorySetId}`;
}

export async function readPalaceSession(memorySetId: string): Promise<PalaceSessionSnapshot | null> {
  const raw = await AsyncStorage.getItem(getKey(memorySetId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PalaceSessionSnapshot;
    if (
      parsed.memorySetId !== memorySetId ||
      !parsed.memorySetVersion ||
      !parsed.mode ||
      !Number.isInteger(parsed.activeIndex) ||
      !Array.isArray(parsed.responses)
    ) {
      await clearPalaceSession(memorySetId);
      return null;
    }
    return parsed;
  } catch {
    await clearPalaceSession(memorySetId);
    return null;
  }
}

export async function writePalaceSession(snapshot: PalaceSessionSnapshot) {
  await AsyncStorage.setItem(getKey(snapshot.memorySetId), JSON.stringify(snapshot));
}

export async function clearPalaceSession(memorySetId: string) {
  await AsyncStorage.removeItem(getKey(memorySetId));
}
