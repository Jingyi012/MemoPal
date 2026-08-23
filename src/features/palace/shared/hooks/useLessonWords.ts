import * as wordService from '@/features/palace/shared/services/word.service';
import type { Word } from '@/features/palace/shared/types/lesson.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const WORD_KEYS = {
  all: ['words'] as const,
  byLesson: (lessonId: string) => [...WORD_KEYS.all, 'lesson', lessonId] as const,
};

export function useLessonWords(lessonId: string) {
  const queryClient = useQueryClient();
  const query = useQuery<Word[]>({
    queryKey: WORD_KEYS.byLesson(lessonId),
    enabled: !!lessonId,
    queryFn: () => wordService.getWordsByLesson(lessonId),
    staleTime: 1000 * 60 * 5,
  });

  const saveWord = useMutation({
    mutationFn: (word: Partial<Word>) => wordService.createWord(word),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) }),
  });
  const saveWords = useMutation({
    mutationFn: (words: Partial<Word>[]) => wordService.createWordsBatch(words),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) }),
  });
  const removeWord = useMutation({
    mutationFn: (id: string) => wordService.deleteWord(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) }),
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
