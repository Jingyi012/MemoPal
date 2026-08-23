import { lessonApi } from '@/features/palace/shared/api/lesson.api';
import type { Lesson, LessonDetails } from '@/features/palace/shared/types/lesson.types';

export async function getLessonsByPalace(palaceId: string): Promise<Lesson[]> {
  return (await lessonApi.getByPalaceId(palaceId)) ?? [];
}

export async function getLessonById(id: string): Promise<LessonDetails | null> {
  return ((await lessonApi.getById(id)) as LessonDetails) ?? null;
}

export async function createLesson(form: Partial<Lesson>): Promise<string> {
  const created = await lessonApi.create(form as Lesson);
  return created.id;
}

export async function updateLesson(id: string, form: Partial<Lesson>): Promise<void> {
  await lessonApi.update({ ...form, id } as Lesson);
}

export async function deleteLesson(id: string): Promise<void> {
  await lessonApi.delete(id);
}
