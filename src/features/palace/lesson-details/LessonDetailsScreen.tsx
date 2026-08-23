import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import CustomBottomSheet from '@/components/CustomBottomSheet';
import { ForgettingCurveCard } from '@/components/information/ForgettingCurve';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { LessonReviewStatCard } from '@/features/palace/lesson-details/components/LessonReviewStatCard';
import { LessonWordList } from '@/features/palace/lesson-details/components/LessonWordList';
import { MasteredCard } from '@/features/palace/lesson-details/components/MasteredLessonCard';
import MemoryRetentionCard from '@/features/palace/lesson-details/components/MemoryRetentionCard';
import { NextReviewCard } from '@/features/palace/lesson-details/components/NextLessonReviewCard';
import { ReviewProgressIndicator } from '@/features/palace/lesson-details/components/ReviewProgressIndicator';
import { StartLearningCard } from '@/features/palace/lesson-details/components/StartLessonCard';
import { useLessonDetailsModel } from '@/features/palace/lesson-details/hooks/useLessonDetailsModel';
import { dateFormatter } from '@/utils/formatter';
import BottomSheet from '@gorhom/bottom-sheet';
import { BookOpen, Calendar, Map, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useRef } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

interface Props {
  lessonId: string;
}

const LessonDetailsScreen: React.FC<Props> = ({ lessonId }) => {
  const {
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
  } = useLessonDetailsModel({ lessonId });
  const bottomSheetRef = useRef<BottomSheet>(null);

  if (isLoading) return <LoadingView />;
  if (!lesson) return null;

  return (
    <>
      <CommonHeader
        title={lesson.title}
        description={lesson.description}
        backAction={handleBack}
        additionalContent={
          hasStartedLearning && !hasMastered ? (
            <MemoryRetentionCard retentionRate={retentionRate} />
          ) : undefined
        }
        actions={
          hasStartedLearning
            ? [{ icon: BookOpen, onPress: () => bottomSheetRef.current?.snapToIndex(2) }]
            : []
        }
        showNotification={!hasStartedLearning}
      />

      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {!hasStartedLearning ? (
          <StartLearningCard wordCount={lesson.wordCount} onStartLearning={handleStartLearning} />
        ) : hasMastered ? (
          <MasteredCard onPracticeAgain={handleStartReview} />
        ) : (
          <View>
            {nextReviewData && (
              <NextReviewCard
                isDue={isDue}
                isOverdue={isOverdue}
                isDueSoon={isDueSoon}
                nextReviewText={getTimeUntilReview() ?? ''}
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

            {progress.reviewSchedules.length > 0 && (
              <ReviewProgressIndicator schedule={progress.reviewSchedules} className="mt-3" />
            )}
            <ForgettingCurveCard className="mt-3" />
          </>
        )}

        {!hasStartedLearning && <LessonWordList words={words} />}
      </ScrollView>

      <CustomBottomSheet ref={bottomSheetRef}>
        <View className="p-4">
          <LessonWordList words={words} />
        </View>
      </CustomBottomSheet>
    </>
  );
};

export default LessonDetailsScreen;
