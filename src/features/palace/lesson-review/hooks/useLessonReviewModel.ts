import { REVIEW_TARGET_SECONDS_PER_WORD } from '@/features/palace/shared/constants/config';
import { useGamificationRewards } from '@/contexts/GamificationRewardContext';
import {
  calculateReviewResults,
  useLessonDetail,
  useLessonWords,
  useLocation,
  useReviewCompletion,
} from '@/features/palace/shared/hooks';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  lessonId: string;
  isLearningMode?: boolean;
};

type ReviewAnswer = {
  wordId: string;
  isCorrect: boolean;
  entered: string;
};

export function useLessonReviewModel({ lessonId, isLearningMode = false }: Props) {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const startedAtRef = useRef(Date.now());
  const currentWordStartedAtRef = useRef(Date.now());

  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [speedBonusXp, setSpeedBonusXp] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(REVIEW_TARGET_SECONDS_PER_WORD);
  const [results, setResults] = useState<ReviewAnswer[]>([]);
  const [perWordSeconds, setPerWordSeconds] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const { data: lesson, isLoading: lessonLoading } = useLessonDetail(lessonId);
  const { words: steps, isLoading: wordsLoading } = useLessonWords(lessonId);
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep] ?? null;
  const { location, isLoading: locationLoading } = useLocation(currentStepData?.locationId || '');
  const { showRewards } = useGamificationRewards();
  const reviewCompletionMutation = useReviewCompletion();

  const reviewResults = useMemo(
    () => calculateReviewResults(results, totalSteps),
    [results, totalSteps]
  );

  const shakeX = useSharedValue(0);
  const scoreScale = useSharedValue(1);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  const streakStyle = useAnimatedStyle(() => ({ transform: [{ scale: scoreScale.value }] }));

  useEffect(() => {
    if (totalSteps > 0) {
      startedAtRef.current = Date.now();
      currentWordStartedAtRef.current = Date.now();
      setCountdownSeconds(REVIEW_TARGET_SECONDS_PER_WORD);
    }
  }, [lessonId, totalSteps]);

  const revealAnswer = useCallback(
    (isCorrect: boolean, entered: string) => {
      if (!currentStepData) return;

      const wordElapsed = Math.max(
        1,
        Math.round((Date.now() - currentWordStartedAtRef.current) / 1000)
      );
      setPerWordSeconds((previous) => [...previous, wordElapsed]);

      if (isCorrect) {
        setFeedback('correct');
        setStreak((previous) => previous + 1);
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

      setResults((previous) => [...previous, { wordId: currentStepData.id, isCorrect, entered }]);
    },
    [currentStepData, scoreScale, shakeX]
  );

  useEffect(() => {
    if (isRevealed || !currentStepData) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentWordStartedAtRef.current) / 1000);
      const left = Math.max(0, REVIEW_TARGET_SECONDS_PER_WORD - elapsed);
      setCountdownSeconds(left);

      if (left <= 0) {
        clearInterval(timer);
        revealAnswer(false, inputValue || '[timeout]');
      }
    }, 250);

    return () => clearInterval(timer);
  }, [currentStep, currentStepData, inputValue, isRevealed, revealAnswer]);

  const handleVerify = useCallback(() => {
    if (isRevealed || !inputValue.trim() || !currentStepData) return;
    const isCorrect = inputValue.trim().toLowerCase() === currentStepData.text.toLowerCase();
    revealAnswer(isCorrect, inputValue);
  }, [currentStepData, inputValue, isRevealed, revealAnswer]);

  const resetReview = useCallback(() => {
    setCurrentStep(0);
    setInputValue('');
    setFeedback(null);
    setIsRevealed(false);
    setStreak(0);
    setXpEarned(0);
    setSpeedBonusXp(0);
    setSessionScore(0);
    setElapsedSeconds(0);
    setResults([]);
    setPerWordSeconds([]);
    setShowSummary(false);
    startedAtRef.current = Date.now();
    currentWordStartedAtRef.current = Date.now();
    setCountdownSeconds(REVIEW_TARGET_SECONDS_PER_WORD);
  }, []);

  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      setIsRevealed(false);
      setFeedback(null);
      setInputValue('');
      setCurrentStep((previous) => previous + 1);
      currentWordStartedAtRef.current = Date.now();
      setCountdownSeconds(REVIEW_TARGET_SECONDS_PER_WORD);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    try {
      const spentSeconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
      const {
        xpEarned: earnedXp,
        levelUpTo,
        achievedMilestones,
        earnedBadges,
        score,
        speedBonusXp: speedBonus,
      } = await reviewCompletionMutation.mutateAsync({
        lessonId,
        correctCount: reviewResults.correctCount,
        totalCount: totalSteps,
        isLearningMode,
        elapsedSeconds: spentSeconds,
        perWordSeconds,
      });
      setElapsedSeconds(spentSeconds);
      setXpEarned(earnedXp);
      setSpeedBonusXp(speedBonus);
      setSessionScore(score);
      showRewards({ levelUpTo, milestones: achievedMilestones, badges: earnedBadges });
      setShowSummary(true);
    } catch (error) {
      console.error('Error submitting review:', error);
      setShowSummary(true);
    }
  }, [
    currentStep,
    isLearningMode,
    lessonId,
    perWordSeconds,
    reviewCompletionMutation,
    reviewResults.correctCount,
    showRewards,
    totalSteps,
  ]);

  const handleFinish = useCallback(() => {
    router.replace(`/lessons/${lessonId}`);
  }, [lessonId, router]);

  return {
    lesson,
    step: currentStepData,
    location,
    currentStep,
    totalSteps,
    inputRef,
    inputValue,
    setInputValue,
    feedback,
    isRevealed,
    streak,
    countdownSeconds,
    shakeStyle,
    streakStyle,
    reviewResults,
    showSummary,
    showExitModal,
    setShowExitModal,
    xpEarned,
    speedBonusXp,
    sessionScore,
    elapsedSeconds,
    isLoading: lessonLoading || wordsLoading || locationLoading,
    isSaving: reviewCompletionMutation.isPending,
    handleVerify,
    handleNext,
    resetReview,
    handleFinish,
  };
}
