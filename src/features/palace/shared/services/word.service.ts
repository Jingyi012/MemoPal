import { wordApi } from '@/features/palace/shared/api/word.api';
import type { Word } from '@/features/palace/shared/types/lesson.types';

export async function getWordsByLesson(lessonId: string): Promise<Word[]> {
  return (await wordApi.getByLessonId(lessonId)) ?? [];
}

export async function getWordById(id: string): Promise<Word | null> {
  return (await wordApi.getById(id)) ?? null;
}

export async function syncLessonWords(lessonId: string, words: Partial<Word>[]): Promise<void> {
  if (words.length === 0) return;
  await wordApi.createBatch(words.map((word) => ({ ...word, lessonId })));
}

export async function createWord(payload: Partial<Word>): Promise<string> {
  const created = await wordApi.create(payload as Word);
  return created.id;
}

export async function createWordsBatch(payload: Partial<Word>[]): Promise<string[]> {
  const created = await wordApi.createBatch(payload);
  return created.map((word) => word.id);
}

export async function updateWord(id: string, payload: Partial<Word>): Promise<void> {
  await wordApi.update({ ...payload, id } as Word);
}

export async function updateWordsBatch(payload: Partial<Word>[]): Promise<void> {
  await wordApi.updateBatch(payload);
}

export async function deleteWord(id: string): Promise<void> {
  await wordApi.delete(id);
}

export async function deleteWordsBatch(ids: string[]): Promise<void> {
  await wordApi.deleteBatch(ids);
}
