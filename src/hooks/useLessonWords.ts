import { useWordRepository } from '@/repositories/word.repo';
import { WordService } from '@/services/word.service';
import { Word } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const WORD_KEYS = {
  all: ['words'] as const,
  byLesson: (lessonId: string) => [...WORD_KEYS.all, 'lesson', lessonId] as const,
};

export function useLessonWords(lessonId: string) {
  const repo = useWordRepository();
  const queryClient = useQueryClient();

  const query = useQuery<Word[]>({
    queryKey: WORD_KEYS.byLesson(lessonId),
    enabled: !!lessonId,
    queryFn: async () => {
      try {
        // 1. BACKGROUND SYNC
        const response = await WordService.getWordsPagedByLesson({
          lessonId,
          pageNumber: 1,
          pageSize: 200,
        });

        if (response.data?.length > 0) {
          await repo.upsertMany(response.data);
        }
      } catch (error) {
        console.warn('Offline or API error: Serving words from SQLite master');
      }

      // 2. SOURCE OF TRUTH: always get from local db
      return repo.getAllByLesson(lessonId);
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveWord = useMutation({
    mutationFn: (word: Partial<Word>) => repo.save(word),
    onSuccess: async (_, word) => {
      // Invalidate the lesson words cache
      await queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    },
  });

  const saveWords = useMutation({
    mutationFn: (word: Partial<Word>[]) => repo.batchSave(word),
    onSuccess: async (_, word) => {
      // Invalidate the lesson words cache
      await queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    },
  });

  const removeWord = useMutation({
    mutationFn: (id: string) => repo.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    },
  });

  return {
    words: query.data ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefetching,
    refresh: query.refetch,
    totalCount: query.data?.length ?? 0,

    saveWord,
    saveWords,
    removeWord,
  };
}
