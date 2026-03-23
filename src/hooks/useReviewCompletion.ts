import * as reviewService from '@/services/review.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PROGRESS_KEYS } from './useLessonProgress';
import { PALACE_KEYS } from './usePalace';
import { CURRENT_USER_KEYS } from './useCurrentUser';
import { MILESTONE_KEYS } from './useMilestones';
import { BADGE_KEYS } from './useBadges';
import { XP_KEYS } from './useXpEvents';
import { MISSION_KEYS } from './useMissions';

export function useReviewCompletion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      lessonId,
      correctCount,
      totalCount,
      isLearningMode,
      elapsedSeconds,
      perWordSeconds,
    }: {
      lessonId: string;
      correctCount: number;
      totalCount: number;
      isLearningMode?: boolean;
      elapsedSeconds?: number;
      perWordSeconds?: number[];
    }) => {
      return reviewService.completeReview(lessonId, correctCount, totalCount, isLearningMode, elapsedSeconds, perWordSeconds);
    },
    onSuccess: ({ lessonId }) => {
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BADGE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: XP_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all });
    },
  });

  return mutation;
}
