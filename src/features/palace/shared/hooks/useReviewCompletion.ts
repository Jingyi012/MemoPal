import * as reviewService from '@/features/palace/shared/services/review.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BADGE_KEYS,
  MILESTONE_KEYS,
  MISSION_KEYS,
  XP_KEYS,
} from '@/features/gamification/shared';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { PALACE_KEYS } from './usePalace';
import { PROGRESS_KEYS } from './useLessonProgress';

export function useReviewCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
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
    }) =>
      reviewService.completeReview(
        lessonId,
        correctCount,
        totalCount,
        isLearningMode,
        elapsedSeconds,
        perWordSeconds
      ),
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
}
