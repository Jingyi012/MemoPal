import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PracticeResponseInput } from '@/features/practice-attempts';

const SESSION_KEY_PREFIX = 'memopal:number-peg-session:';

export type NumberPegSessionSnapshot = {
  memorySetId: string;
  memorySetVersion: number;
  tab: 'scenes' | 'recall';
  questionIndex: number;
  questionOrder?: string[];
  score: number;
  clientAttemptId: string;
  startedAt: string;
  startedAtMs: number;
  questionStartedAtMs: number;
  responses: PracticeResponseInput[];
  savedAt: string;
};

function getKey(memorySetId: string) {
  return `${SESSION_KEY_PREFIX}${memorySetId}`;
}

export async function readNumberPegSession(memorySetId: string): Promise<NumberPegSessionSnapshot | null> {
  const raw = await AsyncStorage.getItem(getKey(memorySetId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as NumberPegSessionSnapshot;
    if (
      parsed.memorySetId !== memorySetId ||
      !Number.isInteger(parsed.questionIndex) ||
      !Array.isArray(parsed.responses) ||
      !parsed.clientAttemptId
    ) {
      return null;
    }
    return parsed;
  } catch {
    await clearNumberPegSession(memorySetId);
    return null;
  }
}

export async function writeNumberPegSession(snapshot: NumberPegSessionSnapshot) {
  await AsyncStorage.setItem(getKey(snapshot.memorySetId), JSON.stringify(snapshot));
}

export async function clearNumberPegSession(memorySetId: string) {
  await AsyncStorage.removeItem(getKey(memorySetId));
}
