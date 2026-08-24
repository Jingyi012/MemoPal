import { practiceAttemptApi } from '@/features/practice-attempts/api/practiceAttempt.api';
import type { PracticeAttemptInput } from '@/features/practice-attempts/types/practiceAttempt.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PRACTICE_KEYS = {
  all: ['practice-attempts'] as const,
  due: () => [...PRACTICE_KEYS.all, 'due'] as const,
};

export function useCreatePracticeAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attempt: PracticeAttemptInput) => {
      const results = await practiceAttemptApi.createBatch([attempt]);
      const created = results[0];
      if (!created) throw new Error('The practice result was not saved.');
      return created;
    },
    retry: false,
    networkMode: 'online',
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.due() }),
  });
}

export function useDueMemoryReviews() {
  return useQuery({
    queryKey: PRACTICE_KEYS.due(),
    queryFn: practiceAttemptApi.getDueReviews,
    staleTime: 1000 * 60,
    networkMode: 'online',
  });
}
