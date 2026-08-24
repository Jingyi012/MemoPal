import { practiceAttemptApi } from '@/features/practice-attempts/api/practiceAttempt.api';
import { getLocalPreviewMemorySet, isLocalPreviewEnabled } from '@/core/dev/localPreviewData';
import type {
  PracticeAttempt,
  PracticeAttemptInput,
} from '@/features/practice-attempts/types/practiceAttempt.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PRACTICE_KEYS = {
  all: ['practice-attempts'] as const,
  due: () => [...PRACTICE_KEYS.all, 'due'] as const,
};

export function useCreatePracticeAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attempt: PracticeAttemptInput) => {
      if (isLocalPreviewEnabled) return createLocalPreviewAttempt(attempt);
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
    queryFn: () => (isLocalPreviewEnabled ? Promise.resolve([]) : practiceAttemptApi.getDueReviews()),
    staleTime: 1000 * 60,
    networkMode: 'online',
  });
}

function createLocalPreviewAttempt(attempt: PracticeAttemptInput): PracticeAttempt {
  const now = new Date().toISOString();
  const createdBy = 'local-preview-user';
  const correctCount = attempt.responses.filter((response) => response.isCorrect).length;
  const techniqueKey = getLocalPreviewMemorySet(attempt.memorySetId)?.techniqueKey ?? 'number-peg';

  return {
    id: `preview-attempt-${Date.now()}`,
    clientAttemptId: attempt.clientAttemptId,
    memorySetId: attempt.memorySetId,
    techniqueKey,
    mode: attempt.mode,
    startedAt: attempt.startedAt,
    completedAt: now,
    durationMs: attempt.durationMs,
    correctCount,
    firstAttemptCorrectCount: correctCount,
    totalCount: attempt.responses.length,
    nextReviewAt: null,
    responses: attempt.responses.map((response, index) => ({
      ...response,
      id: `preview-response-${Date.now()}-${index}`,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    })),
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
  };
}
