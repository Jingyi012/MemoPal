import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EducationCourseAiInput } from '../api/educationCourseDraft.api';

export type EducationCourseGenerationRecovery = { requestId: string; input: EducationCourseAiInput; createdAt: number; maxCredits: number };
const keyFor = (userId: string) => `@memopal/education-course-generation/${userId}`;

function isInput(value: unknown): value is EducationCourseAiInput {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<EducationCourseAiInput>;
  return typeof input.title === 'string' && input.title.length <= 200
    && typeof input.languageCode === 'string' && typeof input.meaningLanguageCode === 'string'
    && (input.difficulty === 'basic' || input.difficulty === 'advanced')
    && (input.contentType === undefined || ['LanguageItem', 'VocabularyPair', 'ConceptUnderstanding', 'VerbatimText'].includes(input.contentType))
    && Array.isArray(input.units) && input.units.length > 0 && input.units.length <= 50
    && input.units.every(unit => !!unit && typeof unit.id === 'string' && typeof unit.title === 'string'
      && Array.isArray(unit.entries) && unit.entries.length > 0 && unit.entries.length <= 50
      && unit.entries.every(entry => !!entry && typeof entry.id === 'string' && typeof entry.text === 'string'
        && (entry.meaning === null || typeof entry.meaning === 'string')));
}

export async function saveEducationCourseGenerationRecovery(userId: string, value: EducationCourseGenerationRecovery): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(value));
}

export async function getEducationCourseGenerationRecovery(userId: string): Promise<EducationCourseGenerationRecovery | null> {
  const value = await AsyncStorage.getItem(keyFor(userId));
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid recovery data');
    const candidate = parsed as Partial<EducationCourseGenerationRecovery>;
    if (typeof candidate.requestId !== 'string' || !/^course-[\w-]{1,100}$/.test(candidate.requestId)
      || typeof candidate.createdAt !== 'number' || !Number.isFinite(candidate.createdAt)
      || typeof candidate.maxCredits !== 'number' || !Number.isInteger(candidate.maxCredits) || candidate.maxCredits < 0 || candidate.maxCredits > 100
      || Date.now() - candidate.createdAt > 7 * 24 * 60 * 60 * 1000 || !isInput(candidate.input)) throw new Error('Invalid or expired recovery data');
    return candidate as EducationCourseGenerationRecovery;
  }
  catch { await AsyncStorage.removeItem(keyFor(userId)); return null; }
}

export async function clearEducationCourseGenerationRecovery(userId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(userId));
}
