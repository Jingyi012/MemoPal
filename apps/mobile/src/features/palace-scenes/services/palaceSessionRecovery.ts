import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PracticeResponseInput } from '@/features/practice-attempts';

export type PalaceSessionMode = 'browse' | 'walk' | 'list' | 'recall';

export type PalaceSessionSnapshot = {
  memorySetId: string;
  memorySetVersion: number;
  mode: PalaceSessionMode;
  activeIndex: number;
  recallOrder?: string[];
  feedback?: 'correct' | 'wrong' | null;
  score: number;
  clientAttemptId: string;
  startedAt: string;
  startedAtMs: number;
  questionStartedAtMs: number;
  responses: PracticeResponseInput[];
  savedAt: string;
};

const SESSION_KEY_PREFIX = 'memopal:palace-session:';

function getKey(memorySetId: string, scope?: string) {
  return `${SESSION_KEY_PREFIX}${memorySetId}${scope ? ':' + scope : ''}`;
}

export async function readPalaceSession(memorySetId: string, scope?: string): Promise<PalaceSessionSnapshot | null> {
  const raw = await AsyncStorage.getItem(getKey(memorySetId, scope));
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
      await clearPalaceSession(memorySetId, scope);
      return null;
    }
    return parsed;
  } catch {
    await clearPalaceSession(memorySetId, scope);
    return null;
  }
}

export async function writePalaceSession(snapshot: PalaceSessionSnapshot, scope?: string) {
  await AsyncStorage.setItem(getKey(snapshot.memorySetId, scope), JSON.stringify(snapshot));
}

export async function clearPalaceSession(memorySetId: string, scope?: string) {
  await AsyncStorage.removeItem(getKey(memorySetId, scope));
}
