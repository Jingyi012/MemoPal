import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, LogOut } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useLessonDetail } from '@/hooks/useLessonsManager';
import { useLocation } from '@/hooks/useLocation';
import { useReviewCompletion } from '@/hooks/useReviewCompletion';
import { calculateReviewResults } from '@/services/review.service';
import { ReviewHeader } from './ReviewHeader';
import { ReviewImageDisplay } from './ReviewImageDisplay';
import { ReviewInputSection } from './ReviewInputSection';
import { ReviewSummary } from './ReviewSummary';

interface ReviewTestProps {
  lessonId: string;
  isLearningMode: boolean;
}

export const ReviewTest: React.FC<ReviewTestProps> = ({ lessonId, isLearningMode = false }) => {
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);

  // Fetch lesson with words
  const { data: lesson, isLoading: lessonLoading } = useLessonDetail(lessonId);
  const steps = useMemo(() => lesson?.words || [], [lesson?.words]);
  const totalSteps = steps.length;

  // Track current step
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Memoize review results calculation
  const reviewResults = useMemo(
    () => calculateReviewResults(results, totalSteps),
    [results, totalSteps]
  );

  // Review submission
  const reviewCompletionMutation = useReviewCompletion();

  const step = steps[currentStep];

  // Fetch location for current word
  const { location, isLoading: locationLoading } = useLocation(step?.locationId || '');

  // Animations
  const shakeX = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: scoreScale.value }] }));

  const handleVerify = () => {
    if (isRevealed || !inputValue.trim()) return;
    const isCorrect = inputValue.trim().toLowerCase() === step.text.toLowerCase();

    if (isCorrect) {
      setFeedback('correct');
      setStreak((s) => s + 1);
      setIsRevealed(true);
      scoreScale.value = withSequence(withSpring(1.5), withSpring(1));
    } else {
      setFeedback('wrong');
      setStreak(0);
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      setTimeout(() => setIsRevealed(true), 500);
    }
    setResults((prev) => [...prev, { wordId: step.id, isCorrect, entered: inputValue }]);
  };

  const resetReview = () => {
    setCurrentStep(0);
    setInputValue('');
    setFeedback(null);
    setIsRevealed(false);
    setStreak(0);
    setXpEarned(0);
    setResults([]);
    setShowSummary(false);
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      // Move to next step
      setIsRevealed(false);
      setFeedback(null);
      setInputValue('');
      setCurrentStep((s) => s + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Submit review
      try {
        const { xpEarned: earnedXp } = await reviewCompletionMutation.mutateAsync({
          lessonId,
          correctCount: reviewResults.correctCount,
          totalCount: totalSteps,
          isLearningMode,
        });
        setXpEarned(earnedXp);
        setShowSummary(true);
      } catch (error) {
        console.error('Error submitting review:', error);
        setShowSummary(true); // Show summary even on error to allow retry/exit
      }
    }
  };

  if (lessonLoading || locationLoading) {
    return <LoadingView />;
  }

  if (!lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text>Lesson not found</Text>
      </View>
    );
  }

  if (showSummary) {
    return (
      <ReviewSummary
        isLearning={isLearningMode}
        correctCount={reviewResults.correctCount}
        totalSteps={totalSteps}
        xpEarned={xpEarned}
        streak={streak}
        onFinish={() => router.push(`/lessons/${lessonId}`)}
        onTryAgain={!reviewResults.isPassed ? resetReview : undefined}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-slate-50">
          <ReviewHeader
            currentStep={currentStep}
            totalSteps={totalSteps}
            streak={streak}
            streakStyle={streakStyle}
            onExit={() => setShowExitModal(true)}
          />

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled">
            <View className="items-center px-6 pt-2">
              <Text className="mb-6 text-center text-2xl font-black text-slate-800">
                What is stored here?
              </Text>
              <Text className="mb-3 text-center text-xl font-medium text-slate-500">
                {location?.name || 'Memory Station'}
              </Text>

              <ReviewImageDisplay
                imageUrl={location?.imageUrl}
                isRevealed={isRevealed}
                feedback={feedback}
              />

              <ReviewInputSection
                inputRef={inputRef}
                value={inputValue}
                onChange={setInputValue}
                feedback={feedback}
                isRevealed={isRevealed}
                onSubmit={handleVerify}
                shakeStyle={shakeStyle}
                correctWord={step.text}
              />
            </View>
          </ScrollView>

          {/* Action Button Section - Sticky to bottom of keyboard */}
          <View className="bg-slate-50 p-6">
            {!isRevealed ? (
              <AnimatedPressable
                onPress={handleVerify}
                className="w-full items-center rounded-2xl bg-slate-900 py-5 shadow-lg">
                <Text className="text-lg font-black text-white">CHECK ANSWER</Text>
              </AnimatedPressable>
            ) : (
              <AnimatedPressable
                onPress={handleNext}
                disabled={reviewCompletionMutation.isPending}
                className="w-full overflow-hidden rounded-2xl shadow-lg">
                <LinearGradient
                  colors={[Colors.teal600, Colors.indigo600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center justify-center py-5">
                  <Text className="mr-2 text-lg font-black text-white">
                    {currentStep === totalSteps - 1
                      ? reviewCompletionMutation.isPending
                        ? 'SAVING...'
                        : 'VIEW RESULTS'
                      : 'NEXT LOCATION'}
                  </Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </LinearGradient>
              </AnimatedPressable>
            )}
          </View>

          <ActionSheet
            isVisible={showExitModal}
            onClose={() => setShowExitModal(false)}
            onAction={() => {
              setShowExitModal(false);
              router.replace(`/lessons/${lessonId}`);
            }}
            title="Exit Lesson?"
            description={`Are you sure you want to exit? Your progress will not be saved.`}
            actionLabel="Exit"
            variant="destructive"
            Icon={LogOut}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
