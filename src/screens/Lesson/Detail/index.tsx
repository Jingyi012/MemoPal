import { CommonHeader } from '@/components/CommonHeader';
import CustomBottomSheet from '@/components/CustomBottomSheet';
import { ForgettingCurveCard } from '@/components/information/ForgettingCurve';
import { Colors } from '@/constants/colors';
import data from '@/utils/mock/lessonsList.json';
import { getNextReview, getRetentionRate, isReviewDueSoon, isReviewOverdue } from '@/utils/review';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { BookOpen, Calendar, Map, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import React, { useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LessonReviewStatCard } from './LessonReviewStatCard';
import { MasteredCard } from './MateredCard';
import MemoryRetentionCard from './MemoryRetentionCard';
import { NextReviewCard } from './NextReviewCard';
import { PalaceWordList } from './PalaceWordList';
import { ReviewProgressIndicator } from './ReviewProgressIndicator';
import { StartLearningCard } from './StartLearningCard';

interface Props {
  lessonId: string;
}

const LessonDetailScreen: React.FC<Props> = ({ lessonId }) => {
  const router = useRouter();
  const lessons = data.lessons;
  const lesson = lessons.find((x) => x.id === lessonId);
  if (!lesson) return null;

  const progress = lesson.progress;
  const hasStartedLearning = !!progress;
  const hasMastered = progress?.masteryLevel === 'mastered';
  const hasCompletedLearning = !!progress?.firstCompletedDate;

  // Review info
  const nextReview = progress ? getNextReview(progress.reviewSchedule) : null;
  const nextReviewData = nextReview ? progress?.reviewSchedule[nextReview] : null;
  const isOverdue = nextReviewData ? isReviewOverdue(nextReviewData.dueDate) : false;
  const isDueSoon = nextReviewData ? isReviewDueSoon(nextReviewData.dueDate) : false;
  const retentionRate = progress ? getRetentionRate(progress.reviewSchedule) : 0;

  const getTimeUntilReview = () => {
    if (!nextReviewData) return null;
    const now = new Date().getTime();
    const due = new Date(nextReviewData.dueDate).getTime();
    const diff = due - now;
    if (diff < 0) {
      const hoursPast = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return `${hoursPast}h overdue`;
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const handleStartLearning = () => router.replace(`/lessons/${lessonId}/learn`);
  const handleStartReview = () => router.replace(`/lessons/${lessonId}/review`);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleBottomSheetOpen = () => bottomSheetRef.current?.snapToIndex(2);

  return (
    <>
      <CommonHeader
        title={lesson.title}
        description={lesson.description}
        backAction={() => router.replace(`/palaces/${lesson.palaceId}`)}
        additionalContent={
          hasStartedLearning && !hasMastered ? (
            <MemoryRetentionCard retentionRate={retentionRate} />
          ) : null
        }
        actions={
          hasStartedLearning ? [{ icon: BookOpen, onPress: () => handleBottomSheetOpen() }] : []
        }
        showNotification={hasStartedLearning ? false : true}
      />

      <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 60 }}>
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
                  isOverdue={isOverdue}
                  isDueSoon={isDueSoon}
                  nextReviewText={getTimeUntilReview()!}
                  onStartReview={handleStartReview}
                />
              )}

              <TouchableOpacity
                onPress={handleStartLearning}
                className="mt-3 flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3">
                <Map size={18} color={Colors.slate600} />
                <Text className="ml-2 font-semibold text-slate-600">Learning</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* WORD LIST SECTION */}
        {!hasStartedLearning && <PalaceWordList words={lesson.words} />}

        {hasStartedLearning && (
          <>
            <View className="mt-3 flex-row flex-wrap gap-4">
              <LessonReviewStatCard
                label="First Learned"
                value={new Date(progress.firstCompletedDate).toLocaleDateString()}
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

            <ReviewProgressIndicator schedule={progress.reviewSchedule} className="mt-3" />
            <ForgettingCurveCard className="mt-3" />
          </>
        )}
      </ScrollView>

      <CustomBottomSheet ref={bottomSheetRef}>
        <View className="p-4">
          <PalaceWordList words={lesson.words} />
        </View>
      </CustomBottomSheet>
    </>
  );
};

export default LessonDetailScreen;
