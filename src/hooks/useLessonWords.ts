import * as wordService from '@/services/word.service';
import { Word } from '@/types/lesson';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const WORD_KEYS = {
  all: ['words'] as const,
  byLesson: (lessonId: string) => [...WORD_KEYS.all, 'lesson', lessonId] as const,
};

/**
 * Hook: Fetch words for a lesson with automatic sync
 * Uses service layer for all business logic
 */
export function useLessonWords(lessonId: string) {
  const queryClient = useQueryClient();

  const query = useQuery<Word[]>({
    queryKey: WORD_KEYS.byLesson(lessonId),
    enabled: !!lessonId,
    queryFn: async () => {
      // Service handles sync and returns local data
      return await wordService.getWordsByLesson(lessonId);
    },
    staleTime: 1000 * 60 * 5,
  });

  const saveWord = useMutation({
    mutationFn: (word: Partial<Word>) => wordService.createWord(word),
    onSuccess: async () => {
      // Invalidate the lesson words cache
      await queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    },
  });

  const saveWords = useMutation({
    mutationFn: (words: Partial<Word>[]) => wordService.createWordsBatch(words),
    onSuccess: async () => {
      // Invalidate the lesson words cache
      await queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    },
  });

  const removeWord = useMutation({
    mutationFn: (id: string) => wordService.deleteWord(id),
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
