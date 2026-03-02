import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import CustomBottomSheet from '@/components/CustomBottomSheet';
import { ForgettingCurveCard } from '@/components/information/ForgettingCurve';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { useLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonDetail } from '@/hooks/useLessonsManager';
import { dateFormatter } from '@/utils/formatter';
import { getNextReview, getRetentionRate, isReviewDueSoon, isReviewOverdue } from '@/utils/review';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { BookOpen, Calendar, Map, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { LessonReviewStatCard } from './LessonReviewStatCard';
import { MasteredCard } from './MateredCard';
import MemoryRetentionCard from './MemoryRetentionCard';
import { NextReviewCard } from './NextReviewCard';
import { LessonWordList } from './PalaceWordList';
import { ReviewProgressIndicator } from './ReviewProgressIndicator';
import { StartLearningCard } from './StartLearningCard';

interface Props {
  lessonId: string;
}

const LessonDetailScreen: React.FC<Props> = ({ lessonId }) => {
  const router = useRouter();
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

  const isLoading = progressLoading || detailLoading;
  const isRefreshing = isProgressRefreshing || isLessonDetailRefreshing;

  const onRefresh = async () => {
    await progressRefresh();
    lessonRefresh();
  };

  const { hasStartedLearning, hasMastered, hasCompletedLearning } = useMemo(() => {
    return {
      hasStartedLearning: progress?.masteryLevel != 'new',
      hasMastered: progress?.masteryLevel === 'mastered',
      hasCompletedLearning: !!progress?.firstCompletedDate,
    };
  }, [progress]);

  // Memoized review info calculations
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
    // A review is "Due" if it's overdue OR if it's due right now
    const due = nextReview ? new Date(nextReview.dueDate) <= new Date() : false;

    return {
      nextReviewData: nextReview,
      isDue: due,
      isOverdue: overdue,
      isDueSoon: nextReview ? isReviewDueSoon(nextReview.dueDate) : false,
      retentionRate: getRetentionRate(progress.reviewSchedules),
    };
  }, [progress]);

  // Enhanced time formatting
  const getTimeUntilReview = useCallback(() => {
    if (!nextReviewData) return null;
    if (isDue) return 'Ready to review';

    const now = new Date().getTime();
    const due = new Date(nextReviewData.dueDate).getTime();
    const diff = due - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Starting soon';
    if (hours < 24) return `Due in ${hours}h`;
    return `Due in ${Math.floor(hours / 24)}d`;
  }, [nextReviewData, isDue]);

  // Memoized callback for navigation handlers
  const handleStartLearning = useCallback(() => {
    router.replace(`/lessons/${lessonId}/learn`);
  }, [lessonId, router]);

  const handleStartReview = useCallback(() => {
    router.replace(`/lessons/${lessonId}/review`);
  }, [lessonId, router]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleBottomSheetOpen = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(2);
  }, []);

  if (isLoading) {
    return <LoadingView />;
  }

  if (!lesson) return null;

  return (
    <>
      <CommonHeader
        title={lesson.title}
        description={lesson.description}
        backAction={() => router.replace(`/palaces/${lesson.palaceId}`)}
        additionalContent={
          hasStartedLearning &&
          !hasMastered && <MemoryRetentionCard retentionRate={retentionRate} />
        }
        actions={
          hasStartedLearning ? [{ icon: BookOpen, onPress: () => handleBottomSheetOpen() }] : []
        }
        showNotification={hasStartedLearning ? false : true}
      />

      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <View className="">
          {!hasStartedLearning ? (
            // User hasn't started learning
            <StartLearningCard wordCount={lesson.wordCount} onStartLearning={handleStartLearning} />
          ) : hasMastered ? (
            // Mastered
            <MasteredCard onPracticeAgain={handleStartReview} />
          ) : (
            // In progress
            <View>
              {nextReviewData && (
                <NextReviewCard
                  isDue={isDue}
                  isOverdue={isOverdue}
                  isDueSoon={isDueSoon}
                  nextReviewText={getTimeUntilReview()!}
                  onStartReview={handleStartReview}
                />
              )}

              <AnimatedPressable
                onPress={handleStartLearning}
                className="mt-3 flex-row items-center justify-center rounded-2xl border border-slate-100 bg-white py-4 shadow-sm">
                <Map size={20} color={Colors.slate600} />
                <View className="ml-3">
                  <Text className="font-bold text-slate-800">Explore Palace</Text>
                  <Text className="text-xs text-slate-500">Walk through your memory path</Text>
                </View>
              </AnimatedPressable>
            </View>
          )}
        </View>

        {hasStartedLearning && progress && (
          <>
            <View className="mt-3 flex-row flex-wrap gap-4">
              <LessonReviewStatCard
                label="First Learned"
                value={dateFormatter(progress.firstCompletedDate) ?? '-'}
                Icon={Calendar}
                iconColor={Colors.teal600}
              />
              <LessonReviewStatCard
                label="Total Reviews"
                value={`${progress.totalReviews}`}
                Icon={TrendingUp}
                iconColor={Colors.green600}
              />
              <LessonReviewStatCard
                label="XP Earned"
                value={`${progress.xpEarned} XP`}
                Icon={Zap}
                iconColor={Colors.yellow600}
              />
              <LessonReviewStatCard
                label="Status"
                value={progress.masteryLevel.toUpperCase()}
                Icon={Trophy}
                iconColor={Colors.purple600}
              />
            </View>

            {progress.reviewSchedules && progress.reviewSchedules.length > 0 && (
              <ReviewProgressIndicator schedule={progress.reviewSchedules} className="mt-3" />
            )}

            <ForgettingCurveCard className="mt-3" />
          </>
        )}

        {/* WORD LIST SECTION */}
        {!hasStartedLearning && <LessonWordList words={lesson.words} />}
      </ScrollView>

      <CustomBottomSheet ref={bottomSheetRef}>
        <View className="p-4">
          <LessonWordList words={lesson.words} />
        </View>
      </CustomBottomSheet>
    </>
  );
};

export default LessonDetailScreen;
