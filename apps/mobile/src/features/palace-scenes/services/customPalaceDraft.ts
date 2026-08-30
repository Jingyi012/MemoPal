import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PalaceLocusInput } from '../types/palaceScene.types';

const DRAFT_VERSION = 1;
const DRAFT_KEY_PREFIX = 'memopal.custom-palace-draft.v1';

export type CustomPalaceDraft = {
  version: typeof DRAFT_VERSION;
  userId: string;
  name: string;
  description: string;
  imageUri: string;
  loci: PalaceLocusInput[];
  savedAt: string;
};

function getKey(userId: string) {
  return `${DRAFT_KEY_PREFIX}.${userId}`;
}

export async function readCustomPalaceDraft(userId: string): Promise<CustomPalaceDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(getKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CustomPalaceDraft>;
    if (parsed.version !== DRAFT_VERSION || parsed.userId !== userId || !Array.isArray(parsed.loci)) {
      await clearCustomPalaceDraft(userId);
      return null;
    }
    return {
      version: DRAFT_VERSION,
      userId,
      name: typeof parsed.name === 'string' ? parsed.name : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
      imageUri: typeof parsed.imageUri === 'string' ? parsed.imageUri : '',
      loci: parsed.loci as PalaceLocusInput[],
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function writeCustomPalaceDraft(
  userId: string,
  draft: Omit<CustomPalaceDraft, 'version' | 'userId' | 'savedAt'>,
) {
  await AsyncStorage.setItem(getKey(userId), JSON.stringify({
    ...draft,
    version: DRAFT_VERSION,
    userId,
    savedAt: new Date().toISOString(),
  } satisfies CustomPalaceDraft));
}

export async function clearCustomPalaceDraft(userId: string) {
  await AsyncStorage.removeItem(getKey(userId));
}
