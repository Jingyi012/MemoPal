import { ActionSheet } from '@/components/ActionSheet';
import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { Colors } from '@/constants/colors';
import { LessonReviewHeader } from '@/features/palace/lesson-review/components/LessonReviewHeader';
import { ReviewImageDisplay } from '@/features/palace/lesson-review/components/LessonReviewImage';
import { ReviewInputSection } from '@/features/palace/lesson-review/components/LessonReviewInput';
import { ReviewSummary } from '@/features/palace/lesson-review/components/LessonReviewSummary';
import { useLessonReviewModel } from '@/features/palace/lesson-review/hooks/useLessonReviewModel';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, LogOut } from 'lucide-react-native';
import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface Props {
  lessonId: string;
  isLearningMode?: boolean;
}

export function ReviewTest({ lessonId, isLearningMode = false }: Props) {
  const {
    lesson,
    step,
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
    isLoading,
    isSaving,
    handleVerify,
    handleNext,
    resetReview,
    handleFinish,
  } = useLessonReviewModel({ lessonId, isLearningMode });

  if (isLoading) return <LoadingView />;

  if (!lesson || !step) {
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
        speedBonusXp={speedBonusXp}
        sessionScore={sessionScore}
        elapsedSeconds={elapsedSeconds}
        streak={streak}
        onFinish={handleFinish}
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
          <LessonReviewHeader
            currentStep={currentStep}
            totalSteps={totalSteps}
            streak={streak}
            streakStyle={streakStyle}
            countdownSeconds={countdownSeconds}
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
                disabled={isSaving}
                className="w-full overflow-hidden rounded-2xl shadow-lg">
                <LinearGradient
                  colors={[Colors.teal600, Colors.indigo600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="flex-row items-center justify-center py-5">
                  <Text className="mr-2 text-lg font-black text-white">
                    {currentStep === totalSteps - 1
                      ? isSaving
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
            onAction={handleFinish}
            title="Exit Lesson?"
            description="Are you sure you want to exit? Your progress will not be saved."
            actionLabel="Exit"
            variant="destructive"
            Icon={LogOut}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
