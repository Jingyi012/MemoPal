import { useLessonRepository } from '@/repositories/lesson.repo';
import { useWordRepository } from '@/repositories/word.repo';
import { LessonService } from '@/services/lesson.service';
import { Lesson, LessonDetails, LessonForm } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const LESSON_KEYS = {
  all: ['lessons'] as const,
  byPalace: (palaceId: string) => [...LESSON_KEYS.all, 'palace', palaceId] as const,
  detail: (lessonId: string) => [...LESSON_KEYS.all, 'detail', lessonId] as const,
};

export function useLessonList(palaceId: string) {
  const repo = useLessonRepository();

  return useQuery<Lesson[]>({
    queryKey: LESSON_KEYS.byPalace(palaceId),
    enabled: !!palaceId,
    queryFn: async () => {
      try {
        const res = await LessonService.getLessonsByPalace({ palaceId });
        if (res.data?.length) await repo.upsertMany(res.data);
      } catch {
        console.warn('Offline: Serving lessons from SQLite');
      }

      return await repo.getAllByPalace(palaceId);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLessonDetail(lessonId?: string) {
  const repo = useLessonRepository();
  const wordRepo = useWordRepository();

  return useQuery<LessonDetails | null>({
    queryKey: LESSON_KEYS.detail(lessonId!),
    enabled: !!lessonId,
    queryFn: async () => {
      try {
        const res = await LessonService.getLessonById(lessonId!);
        if (res) {
          await repo.save(res);
          if (res.words) await wordRepo.upsertMany(res.words);
        }
      } catch {
        console.warn('Offline: Serving lesson detail from SQLite');
      }
      return repo.getDetails(lessonId!);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLessonMutations(palaceId: string) {
  const repo = useLessonRepository();
  const wordRepo = useWordRepository();
  const queryClient = useQueryClient();

  const saveLesson = useMutation({
    mutationFn: async (data: LessonForm | LessonDetails) => {
      const { words, ...lessonData } = data;

      var wordCount = words.length;

      const id = await repo.save({ ...lessonData, wordCount, palaceId });

      if (words) {
        await wordRepo.syncLessonWords(
          id,
          words.map((w) => ({ ...w, lessonId: id }))
        );
      }

      return { ...data, id };
    },
    onSuccess: (lesson) => {
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.detail(lesson.id!) });
    },
  });

  const removeLesson = useMutation({
    mutationFn: async (id: string) => {
      await repo.remove(id);
      return id;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: LESSON_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
    },
  });

  return { saveLesson, removeLesson };
}
