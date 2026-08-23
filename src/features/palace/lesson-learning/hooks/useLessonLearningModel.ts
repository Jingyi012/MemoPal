import { SourceType } from '@/enums/sourceType';
import {
  BADGE_KEYS,
  MILESTONE_KEYS,
  MISSION_KEYS,
  XP_KEYS,
  recordXpEventWithClientEventId,
  useXpConfigBySource,
} from '@/features/gamification/shared';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import {
  PALACE_KEYS,
  useLessonDetail,
  useLessonProgress,
  useLessonWords,
  usePalace,
  useSaveLessonProgress,
} from '@/features/palace/shared/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Props = {
  lessonId: string;
};

type CompletionRewards = {
  levelUpTo?: number;
  milestones: string[];
  badges: string[];
};

export function useLessonLearningModel({ lessonId }: Props) {
  const queryClient = useQueryClient();
  const { isLoading: detailLoading, data: lesson } = useLessonDetail(lessonId);
  const { words, isLoading: wordsLoading } = useLessonWords(lessonId);
  const { isLoading: progressLoading, progress: lessonProgress } = useLessonProgress(lessonId);
  const { data: palaceDetails } = usePalace(lesson?.palaceId ?? '');
  const { data: xpConfig } = useXpConfigBySource(SourceType.LessonInitialCompletion);
  const { saveProgressAsync } = useSaveLessonProgress();

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionXp, setCompletionXp] = useState(0);
  const [completionRewards, setCompletionRewards] = useState<CompletionRewards>({
    milestones: [],
    badges: [],
  });
  const [isFinalizingCompletion, setIsFinalizingCompletion] = useState(false);
  const [hasFinalizedCompletion, setHasFinalizedCompletion] = useState(false);

  const locations = palaceDetails?.locations;
  const safeWordCount = Math.max(words.length, 1);
  const currentWord = words[currentStep] ?? null;
  const isLastStep = currentStep === words.length - 1;
  const progress = ((currentStep + 1) / safeWordCount) * 100;

  const handleNext = useCallback(() => {
    if (words.length === 0) return;

    if (currentStep < words.length - 1) {
      setCurrentStep((previous) => previous + 1);
    } else {
      setIsCompleted(true);
    }
  }, [currentStep, words.length]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((previous) => previous - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isCompleted || hasFinalizedCompletion || !lesson) return;

    let isMounted = true;

    const finalizeCompletion = async () => {
      setIsFinalizingCompletion(true);

      try {
        let earnedXp = 0;

        if (lessonProgress?.masteryLevel === 'new') {
          earnedXp = Math.max(0, (xpConfig?.baseXp ?? 25) + (xpConfig?.variableXp ?? 0));

          await saveProgressAsync({
            ...lessonProgress,
            masteryLevel: 'learning',
            firstCompletedDate: new Date().toISOString(),
          });

          const xpResult = await recordXpEventWithClientEventId(
            SourceType.LessonInitialCompletion,
            earnedXp,
            `lesson_initial_completion:${lessonId}`,
            lessonId
          );

          setCompletionRewards({
            levelUpTo: xpResult.levelUpTo,
            milestones: xpResult.achievedMilestones,
            badges: xpResult.earnedBadges,
          });

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: XP_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: BADGE_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all }),
            queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all }),
          ]);
        }

        if (isMounted) setCompletionXp(earnedXp);
      } catch (error) {
        console.error('Failed to finalize lesson completion rewards:', error);
      } finally {
        if (isMounted) {
          setHasFinalizedCompletion(true);
          setIsFinalizingCompletion(false);
        }
      }
    };

    void finalizeCompletion();

    return () => {
      isMounted = false;
    };
  }, [
    hasFinalizedCompletion,
    isCompleted,
    lesson,
    lessonId,
    lessonProgress,
    queryClient,
    saveProgressAsync,
    xpConfig?.baseXp,
    xpConfig?.variableXp,
  ]);

  return useMemo(
    () => ({
      lesson,
      words,
      locations,
      currentStep,
      currentWord,
      isLastStep,
      progress,
      isCompleted,
      completionXp,
      completionRewards,
      isFinalizingCompletion,
      hasFinalizedCompletion,
      isLoading: detailLoading || progressLoading || wordsLoading,
      handleNext,
      handlePrevious,
    }),
    [
      completionRewards,
      completionXp,
      currentStep,
      currentWord,
      detailLoading,
      handleNext,
      handlePrevious,
      hasFinalizedCompletion,
      isCompleted,
      isFinalizingCompletion,
      isLastStep,
      lesson,
      locations,
      progress,
      progressLoading,
      words,
      wordsLoading,
    ]
  );
}

export type { CompletionRewards };
