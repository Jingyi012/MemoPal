import { AppImage } from '@/components/AppImage';
import LoadingView from '@/components/LoadingView';
import { StepNavigationFooter } from '@/components/StepNavigationFooter';
import { SourceType } from '@/enums/sourceType';
import { useLessonProgress, useSaveLessonProgress } from '@/hooks/useLessonProgress';
import { useLessonWords } from '@/hooks/useLessonWords';
import { useLessonDetail } from '@/hooks/useLessonsManager';
import { MISSION_KEYS } from '@/hooks/useMissions';
import { PALACE_KEYS, usePalace } from '@/hooks/usePalace';
import { BADGE_KEYS } from '@/hooks/useBadges';
import { CURRENT_USER_KEYS } from '@/hooks/useCurrentUser';
import { MILESTONE_KEYS } from '@/hooks/useMilestones';
import { XP_KEYS } from '@/hooks/useXpEvents';
import { useXpConfigBySource } from '@/hooks/useXpConfig';
import { recordXpEventWithClientEventId } from '@/services/xpEvents.service';
import { useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LearningCompletion } from './LearningCompletion';

interface LearningFlowProps {
  lessonId: string;
}

export function LearnLessonScreen({ lessonId }: LearningFlowProps) {
  const queryClient = useQueryClient();
  const { isLoading: detailLoading, data: lesson } = useLessonDetail(lessonId);
  const { words, isLoading: wordsLoading } = useLessonWords(lessonId);
  const { isLoading: progressLoading, progress: lessonProgress } = useLessonProgress(lessonId);
  const { data: palaceDetails } = usePalace(lesson?.palaceId!);
  const locations = palaceDetails?.locations;

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionXp, setCompletionXp] = useState(0);
  const [completionRewards, setCompletionRewards] = useState<{
    levelUpTo?: number;
    milestones: string[];
    badges: string[];
  }>({ milestones: [], badges: [] });
  const [isFinalizingCompletion, setIsFinalizingCompletion] = useState(false);
  const [hasFinalizedCompletion, setHasFinalizedCompletion] = useState(false);

  const safeWordCount = Math.max(words.length, 1);

  const progress = ((currentStep + 1) / safeWordCount) * 100;
  const currentWord = words[currentStep] ?? null;
  const isLastStep = currentStep === words.length - 1;

  const handleNext = () => {
    if (words.length === 0) {
      return;
    }

    if (currentStep < words.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  /* ================= COMPLETION ================= */
  const { data: xpConfig } = useXpConfigBySource(SourceType.LessonInitialCompletion);
  const { saveProgressAsync } = useSaveLessonProgress();

  useEffect(() => {
    if (!isCompleted || hasFinalizedCompletion || !lesson) {
      return;
    }

    let isMounted = true;

    const finalizeCompletion = async () => {
      setIsFinalizingCompletion(true);

      try {
        let earnedXp = 0;

        if (lessonProgress?.masteryLevel === 'new') {
          earnedXp = Math.max(0, (xpConfig?.baseXp ?? 25) + (xpConfig?.variableXp ?? 0));

          const nextProgress = {
            ...lessonProgress,
            masteryLevel: 'learning' as const,
            firstCompletedDate: new Date().toISOString(),
          };
          await saveProgressAsync(nextProgress);

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

          queryClient.invalidateQueries({ queryKey: XP_KEYS.all });
          queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
          queryClient.invalidateQueries({ queryKey: MILESTONE_KEYS.all });
          queryClient.invalidateQueries({ queryKey: BADGE_KEYS.all });
          queryClient.invalidateQueries({ queryKey: MISSION_KEYS.all });
          queryClient.invalidateQueries({ queryKey: PALACE_KEYS.all });
        }

        if (!isMounted) return;
        setCompletionXp(earnedXp);
      } catch (error) {
        console.error('Failed to finalize lesson completion rewards:', error);
      } finally {
        if (!isMounted) return;
        setHasFinalizedCompletion(true);
        setIsFinalizingCompletion(false);
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

  if (detailLoading || progressLoading || wordsLoading) {
    return <LoadingView />;
  }

  if (!lesson || !locations || words.length === 0 || !currentWord) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-slate-600">Lesson not found</Text>
      </View>
    );
  }

  if (isCompleted) {
    if (isFinalizingCompletion && !hasFinalizedCompletion) {
      return <LoadingView />;
    }

    return (
      <LearningCompletion
        stepsCount={words.length}
        lessonId={lessonId}
        palaceId={lesson.palaceId}
        earnedXp={completionXp}
        rewards={completionRewards}
      />
    );
  }

  /* ================= LEARNING ================= */

  return (
    <View className="flex-1 bg-white">
      {/* Progress bar */}
      <View className="h-2 bg-gray-100">
        <View className="h-full bg-teal-600" style={{ width: `${progress}%` }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <Animated.View key={currentWord.id} entering={FadeInRight}>
          {/* Header */}
          <View className="my-6 items-center">
            <Text className="mb-1 text-slate-600">
              Word {currentStep + 1} of {words.length}
            </Text>
            <Text className="text-2xl font-bold text-slate-800">
              {locations.find((x) => x.id === currentWord.locationId)?.name ?? 'Memory Palace'}
            </Text>
          </View>

          {/* Image */}
          <View className="mb-6 h-56 w-full rounded-2xl">
            <AppImage
              source={{
                uri:
                  locations.find((x) => x.id === currentWord.locationId)?.imageUrl ??
                  'https://picsum.photos/800/600',
              }}
              style={{
                borderRadius: 16,
              }}
            />
          </View>

          {/* Word card */}
          <View className="mb-6 items-center rounded-2xl bg-teal-600 p-6">
            <Text className="mb-1 text-sm text-teal-100">Word to Remember</Text>
            <Text className="text-3xl font-extrabold text-white">{currentWord.text}</Text>
            <Text className="mt-2 text-teal-50">{currentWord.meaning}</Text>
          </View>

          {/* Tip */}
          <View className="mb-6 flex-row rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Sparkles size={20} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="mb-1 font-bold text-slate-800">Visualization Tip</Text>
              <Text className="text-slate-600">
                Imagine this word in an exaggerated, emotional way inside your palace.
              </Text>
            </View>
          </View>

          {/* Instructions */}
          <View className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <Text className="mb-3 font-bold text-purple-900">How to Practice</Text>

            {[
              'Visualize the location clearly',
              `Place "${currentWord.text}" in the scene`,
              'Use sound, color, and movement',
              'Replay the image multiple times',
            ].map((text, index) => (
              <Text key={index} className="mb-2 text-slate-600">
                {index + 1}. {text}
              </Text>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <StepNavigationFooter
        onPrevious={currentStep === 0 ? undefined : handlePrevious}
        onNext={handleNext}
        nextLabel={isLastStep ? 'Completed' : 'Next'}
      />
    </View>
  );
}
