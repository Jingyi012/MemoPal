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

/**
 * Combined hook: fetch + mutations
 * @param palaceId The ID of the palace
 * @param lessonId Optional: provide this if you are on an Edit/Detail screen
 */
export function useLessonsManager(palaceId: string, lessonId?: string) {
  const repo = useLessonRepository();
  const wordRepo = useWordRepository();
  const queryClient = useQueryClient();

  // ------------------ QUERIES ------------------

  // 1. Fetch List of Lessons for a Palace
  const listQuery = useQuery<Lesson[]>({
    queryKey: LESSON_KEYS.byPalace(palaceId),
    enabled: !!palaceId,
    queryFn: async () => {
      try {
        const response = await LessonService.getPagedLessonsByPalace({
          palaceId,
          pageNumber: 1,
          pageSize: 200,
        });
        if (response.data?.length > 0) {
          await repo.upsertMany(response.data);
        }
      } catch (error) {
        console.warn('Offline: Serving lessons from SQLite');
      }
      return await repo.getAllByPalace(palaceId);
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Single Lesson Detail (Lesson + Words)
  const detailQuery = useQuery<LessonDetails | null>({
    queryKey: LESSON_KEYS.detail(lessonId!),
    enabled: !!lessonId,
    queryFn: async () => {
      try {
        const response = await LessonService.getLessonById(lessonId!);
        if (response) {
          await repo.save(response);
          if (response.words) {
            await wordRepo.upsertMany(response.words);
          }
        }
      } catch (error) {
        console.warn('Offline: Serving lesson detail from SQLite');
      }

      // Fetch from local SQLite
      const lesson = await repo.getDetails(lessonId!);
      if (!lesson) return null;

      const words = await wordRepo.getAllByLesson(lessonId!);

      return {
        ...lesson,
        words,
      } as LessonDetails;
    },
    staleTime: 1000 * 60 * 5,
  });

  // ------------------ MUTATIONS ------------------

  const saveLesson = useMutation({
    mutationFn: async (data: LessonForm | LessonDetails) => {
      const { words, ...lessonData } = data;

      const id = await repo.save({
        ...lessonData,
        palaceId,
      });

      if (words) {
        const wordsWithLessonId = words.map((w) => ({
          ...w,
          lessonId: id,
        }));
        await wordRepo.syncLessonWords(id, wordsWithLessonId);
      }

      return { ...data, id };
    },
    onSuccess: (savedLesson) => {
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.detail(savedLesson.id!) });
      // Also invalidate generic word queries if you have them
      queryClient.invalidateQueries({ queryKey: ['words', savedLesson.id] });
    },
  });

  const upsertLessons = useMutation({
    mutationFn: async (lessons: Lesson[]) => {
      await repo.upsertMany(lessons);
      return lessons;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LESSON_KEYS.byPalace(palaceId) });
    },
  });

  const removeLesson = useMutation({
    mutationFn: async (id: string) => {
      await repo.remove(id);
      return id;
    },
    onSuccess: async (_, id) => {
      queryClient.setQueryData<Lesson[]>(
        LESSON_KEYS.byPalace(palaceId),
        (old) => old?.filter((l) => l.id !== id) ?? []
      );
      queryClient.removeQueries({ queryKey: LESSON_KEYS.detail(id) });
    },
  });

  return {
    // List Query
    lessons: listQuery.data ?? [],
    isListLoading: listQuery.isLoading,

    // Detail Query
    lesson: detailQuery.data,
    isDetailLoading: detailQuery.isLoading,
    detailError: detailQuery.error,

    // Shared
    isLoading: listQuery.isLoading || detailQuery.isLoading,
    isRefreshing: listQuery.isRefetching || detailQuery.isRefetching,
    refresh: () => {
      listQuery.refetch();
      if (lessonId) detailQuery.refetch();
    },

    // Mutations
    saveLesson,
    upsertLessons,
    removeLesson,
  };
}
