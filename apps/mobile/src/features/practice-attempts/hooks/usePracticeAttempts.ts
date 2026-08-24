import { practiceAttemptApi } from '@/features/practice-attempts/api/practiceAttempt.api';
import { getLocalPreviewMemorySet, isLocalPreviewEnabled } from '@/core/dev/localPreviewData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PracticeAttempt,
  PracticeAttemptInput,
} from '@/features/practice-attempts/types/practiceAttempt.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const PRACTICE_KEYS = {
  all: ['practice-attempts'] as const,
  due: () => [...PRACTICE_KEYS.all, 'due'] as const,
  history: (memorySetId: string) => [...PRACTICE_KEYS.all, 'history', memorySetId] as const,
};

const LOCAL_PREVIEW_ATTEMPTS_KEY = 'memopal:preview:practice-attempts';

export function useCreatePracticeAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attempt: PracticeAttemptInput) => {
      if (isLocalPreviewEnabled) {
        const created = createLocalPreviewAttempt(attempt);
        await saveLocalPreviewAttempt(created);
        return created;
      }
      const results = await practiceAttemptApi.createBatch([attempt]);
      const created = results[0];
      if (!created) throw new Error('The practice result was not saved.');
      return created;
    },
    retry: false,
    networkMode: 'online',
    onSuccess: (attempt) => {
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.due() });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.history(attempt.memorySetId) });
    },
  });
}

export function usePracticeAttemptHistory(memorySetId: string) {
  return useQuery({
    queryKey: PRACTICE_KEYS.history(memorySetId),
    enabled: Boolean(memorySetId),
    queryFn: async () => {
      if (isLocalPreviewEnabled) {
        const attempts = await loadLocalPreviewAttempts();
        return attempts.filter((attempt) => attempt.memorySetId === memorySetId);
      }
      return practiceAttemptApi.getHistory(memorySetId);
    },
    staleTime: 1000 * 30,
    networkMode: 'online',
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

  const created: PracticeAttempt = {
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
  return created;
}

async function loadLocalPreviewAttempts(): Promise<PracticeAttempt[]> {
  const raw = await AsyncStorage.getItem(LOCAL_PREVIEW_ATTEMPTS_KEY);
  if (!raw) return [];
  try {
    const attempts = JSON.parse(raw) as PracticeAttempt[];
    return Array.isArray(attempts) ? attempts : [];
  } catch {
    await AsyncStorage.removeItem(LOCAL_PREVIEW_ATTEMPTS_KEY);
    return [];
  }
}

async function saveLocalPreviewAttempt(attempt: PracticeAttempt) {
  const attempts = await loadLocalPreviewAttempts();
  await AsyncStorage.setItem(
    LOCAL_PREVIEW_ATTEMPTS_KEY,
    JSON.stringify([attempt, ...attempts].slice(0, 20))
  );
}
