import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  LESSON_KEYS,
  PROGRESS_KEYS,
  useLessonDetail,
  useLessonProgress,
  useLessonWords,
  WORD_KEYS,
} from '@/features/palace/shared/hooks';
import { getNextReview, getRetentionRate, isReviewDueSoon, isReviewOverdue } from '@/features/palace/shared/utils/review';

type Props = {
  lessonId: string;
};

export function useLessonDetailsModel({ lessonId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    progress,
    isLoading: progressLoading,
    isRefreshing: isProgressRefreshing,
    refresh: progressRefresh,
  } = useLessonProgress(lessonId);
  const {
    isLoading: detailLoading,
    data: lesson,
    isRefetching: isLessonDetailRefreshing,
    refetch: lessonRefresh,
  } = useLessonDetail(lessonId);
  const {
    words,
    isLoading: wordsLoading,
    isRefreshing: isWordsRefreshing,
    refresh: wordsRefresh,
  } = useLessonWords(lessonId);

  const isLoading = progressLoading || detailLoading || wordsLoading;
  const isRefreshing = isProgressRefreshing || isLessonDetailRefreshing || isWordsRefreshing;

  const onRefresh = useCallback(async () => {
    await Promise.all([progressRefresh(), lessonRefresh(), wordsRefresh()]);
  }, [lessonRefresh, progressRefresh, wordsRefresh]);

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.detail(lessonId) });
      void queryClient.invalidateQueries({ queryKey: LESSON_KEYS.detail(lessonId) });
      void queryClient.invalidateQueries({ queryKey: WORD_KEYS.byLesson(lessonId) });
    }, [lessonId, queryClient])
  );

  const { hasStartedLearning, hasMastered } = useMemo(
    () => ({
      hasStartedLearning: progress?.masteryLevel !== 'new',
      hasMastered: progress?.masteryLevel === 'mastered',
    }),
    [progress]
  );

  const { isDue, nextReviewData, isOverdue, isDueSoon, retentionRate } = useMemo(() => {
    if (!progress?.reviewSchedules) {
      return {
        isDue: false,
        nextReviewData: null,
        isOverdue: false,
        isDueSoon: false,
        retentionRate: 0,
      };
    }

    const nextReview = getNextReview(progress.reviewSchedules);
    const overdue = nextReview ? isReviewOverdue(nextReview.dueDate) : false;
    const due = nextReview ? new Date(nextReview.dueDate) <= new Date() : false;

    return {
      nextReviewData: nextReview,
      isDue: due,
      isOverdue: overdue,
      isDueSoon: nextReview ? isReviewDueSoon(nextReview.dueDate) : false,
      retentionRate: getRetentionRate(progress.reviewSchedules),
    };
  }, [progress]);

  const getTimeUntilReview = useCallback(() => {
    if (!nextReviewData) return null;
    if (isDue) return 'Ready to review';

    const diff = new Date(nextReviewData.dueDate).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Starting soon';
    if (hours < 24) return `Due in ${hours}h`;
    return `Due in ${Math.floor(hours / 24)}d`;
  }, [isDue, nextReviewData]);

  const handleBack = useCallback(() => {
    router.replace(`/palaces/${lesson?.palaceId ?? ''}`);
  }, [lesson?.palaceId, router]);

  const handleStartLearning = useCallback(() => {
    router.replace(`/lessons/${lessonId}/learn`);
  }, [lessonId, router]);

  const handleStartReview = useCallback(() => {
    router.replace(`/lessons/${lessonId}/review`);
  }, [lessonId, router]);

  return {
    lesson,
    words,
    progress,
    isLoading,
    isRefreshing,
    onRefresh,
    hasStartedLearning,
    hasMastered,
    isDue,
    nextReviewData,
    isOverdue,
    isDueSoon,
    retentionRate,
    getTimeUntilReview,
    handleBack,
    handleStartLearning,
    handleStartReview,
  };
}
