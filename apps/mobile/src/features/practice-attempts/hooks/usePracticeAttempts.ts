import { practiceAttemptApi } from '@/features/practice-attempts/api/practiceAttempt.api';
import { InAppNotificationSync } from '@/features/notifications/services/inAppNotificationSync';
import { getLocalPreviewMemorySet, isLocalPreviewEnabled } from '@/core/dev/localPreviewData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PracticeAttempt,
  PracticeAttemptInput,
  PracticeStats,
} from '@/features/practice-attempts/types/practiceAttempt.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserState } from '@/contexts/UserStateContext';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import { resolveNextStreak } from '@/features/gamification/shared/utils/streak';
import { XP_KEYS } from '@/features/gamification/shared/hooks/useXpEvents';
import { MILESTONE_KEYS } from '@/features/gamification/shared/hooks/useMilestones';
import { COMPANION_KEYS } from '@/features/profile/hooks/useCompanion';
import { COMMUNITY_LEADERBOARD_KEYS } from '@/features/leaderboard/hooks/useCommunityLeaderboard';

import { PRACTICE_KEYS } from '../queryKeys';
export { PRACTICE_KEYS } from '../queryKeys';

const LOCAL_PREVIEW_ATTEMPTS_KEY = 'memopal:preview:practice-attempts';

export function useCreatePracticeAttempt() {
  const queryClient = useQueryClient();
  const { userState } = useUserState();
  return useMutation({
    mutationFn: async (attempt: PracticeAttemptInput) => {
      if (isLocalPreviewEnabled) {
        const previousAttempts = await loadLocalPreviewAttempts();
        const isFirstForMemory = !previousAttempts.some(
          (item) => item.memorySetId === attempt.memorySetId && item.mode === 'recall',
        );
        const xpEarned = isFirstForMemory ? 20 : 5;
        const previousTotalXp = previousAttempts.reduce((sum, item) => sum + Math.max(0, item.xpEarned), 0);
        const created = createLocalPreviewAttempt(attempt, xpEarned, previousTotalXp);
        await saveLocalPreviewAttempt(created);
        await updateLocalPreviewStreak();
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
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.upcoming() });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.history(attempt.memorySetId) });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.progress(attempt.memorySetId) });
      void queryClient.invalidateQueries({ queryKey: PRACTICE_KEYS.stats() });
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: XP_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: COMPANION_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: COMMUNITY_LEADERBOARD_KEYS.all });
      void InAppNotificationSync.syncAllUpcoming(
        userState.notifications.reviewReminders,
        userState.preferences.language,
      );
    },
  });
}

async function updateLocalPreviewStreak() {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return;
  try {
    const user = JSON.parse(raw) as {
      stats?: { currentStreak?: number; longestStreak?: number; lastActiveDate?: string | null };
    };
    const next = resolveNextStreak({
      currentStreak: user.stats?.currentStreak ?? 0,
      longestStreak: user.stats?.longestStreak ?? 0,
      lastActiveDate: user.stats?.lastActiveDate,
    });
    user.stats = {
      ...user.stats,
      ...next,
      lastActiveDate: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Preview data is best effort; a failed local profile update must not
    // prevent the practice result from being shown.
  }
}

export function usePracticeStats() {
  return useQuery({
    queryKey: PRACTICE_KEYS.stats(),
    queryFn: async () => (isLocalPreviewEnabled
      ? buildPracticeStats(await loadLocalPreviewAttempts())
      : practiceAttemptApi.getStats()),
    staleTime: 1000 * 30,
    networkMode: 'online',
  });
}

function buildPracticeStats(attempts: PracticeAttempt[]): PracticeStats {
  const total = attempts.reduce((sum, attempt) => sum + Math.max(0, attempt.totalCount), 0);
  const recalledFirstTry = attempts.reduce(
    (sum, attempt) => sum + Math.min(Math.max(0, attempt.firstAttemptCorrectCount), attempt.totalCount),
    0,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dateKey = localDateKey(date);
    return {
      date: dateKey,
      sessions: attempts.filter((attempt) => localDateKey(new Date(attempt.completedAt)) === dateKey).length,
    };
  });
  return {
    sessionsCompleted: attempts.length,
    wordsLearned: new Set(attempts.flatMap((attempt) => attempt.responses.map((response) => response.memoryItemId))).size,
    firstAttemptRecallPercent: total ? Math.round((recalledFirstTry / total) * 100) : 0,
    weeklyActivity,
  };
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

export function useMemoryReviewProgress(memorySetId: string) {
  return useQuery({
    queryKey: PRACTICE_KEYS.progress(memorySetId),
    enabled: Boolean(memorySetId),
    refetchInterval: 30_000,
    refetchOnMount: 'always',
    // Local preview has no authoritative schedules. Never invent stage counts.
    queryFn: () => isLocalPreviewEnabled
      ? Promise.resolve(null) : practiceAttemptApi.getReviewProgress(memorySetId),
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

export function useUpcomingMemoryReviews(days = 30) {
  return useQuery({
    queryKey: PRACTICE_KEYS.upcoming(days),
    queryFn: () => (isLocalPreviewEnabled ? Promise.resolve([]) : practiceAttemptApi.getUpcomingReviews(days)),
    staleTime: 1000 * 60,
    networkMode: 'online',
  });
}

function createLocalPreviewAttempt(attempt: PracticeAttemptInput, xpEarned: number, previousTotalXp: number): PracticeAttempt {
  const now = new Date().toISOString();
  const createdBy = 'local-preview-user';
  const correctCount = attempt.responses.filter((response) => response.isCorrect).length;
  const firstAttemptCorrectCount = attempt.responses.filter(
    (response) => response.isCorrect && response.attemptCount === 1,
  ).length;
  const techniqueKey = getLocalPreviewMemorySet(attempt.memorySetId)?.techniqueKey ?? 'number-peg';

  const totalXp = previousTotalXp + xpEarned;
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
    firstAttemptCorrectCount,
    totalCount: attempt.responses.length,
    nextReviewAt: null,
    xpEarned,
    xpSourceType: xpEarned === 20 ? 'memory_learned' : 'extra_practice_completed',
    totalXp,
    previousLevel: Math.floor(previousTotalXp / 100) + 1,
    currentLevel: Math.floor(totalXp / 100) + 1,
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
