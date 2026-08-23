import { ActionSheet } from '@/components/ActionSheet';
import { CommonHeader } from '@/components/CommonHeader';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { LessonInfoStep } from '@/features/palace/lesson-create/components/LessonInfoStep';
import { LocationCanvasStep } from '@/features/palace/lesson-create/components/LessonLocationCanvasStep';
import { ReviewSummaryStep } from '@/features/palace/lesson-create/components/LessonReviewSummaryStep';
import {
  CREATE_LESSON_STEPS,
  useCreateLessonModel,
} from '@/features/palace/lesson-create/hooks/useCreateLessonModel';
import { LogOut, X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

interface Props {
  palaceId: string;
}

export const CreateLessonScreen: React.FC<Props> = ({ palaceId }) => {
  const {
    step,
    currentStepIndex,
    form,
    words,
    lessons,
    lessonLimit,
    wordsLimit,
    isLoadingLimits,
    isLessonLimitReached,
    isSaving,
    isExitSheetVisible,
    setForm,
    setWords,
    setIsExitSheetVisible,
    goToInfo,
    goToLocations,
    goToReview,
    exit,
    handleSaveLesson,
  } = useCreateLessonModel({ palaceId });

  if (isLoadingLimits) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (isLessonLimitReached) {
    return (
      <View className="flex-1 bg-white">
        <CommonHeader title="Create Lesson" hideBackButton={false} backAction={exit} />
        <View className="p-5">
          <Text className="text-amber-700">
            Lesson limit reached for this palace ({lessons.length}/{lessonLimit} custom lessons).
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <CommonHeader
        title="Create Lesson"
        description="Fill in the details below"
        hideBackButton
        actions={[{ icon: X, onPress: () => setIsExitSheetVisible(true) }]}
        additionalContent={
          <View className="mt-2">
            <SegmentedProgressBar
              total={CREATE_LESSON_STEPS.length}
              current={currentStepIndex}
              label={CREATE_LESSON_STEPS[currentStepIndex].label}
            />
          </View>
        }
      />

      <View className="flex-1">
        {step === 'info' && (
          <LessonInfoStep value={form} onChange={setForm} onNext={goToLocations} />
        )}
        {step === 'locations' && (
          <LocationCanvasStep
            palaceId={palaceId}
            words={words}
            wordsLimit={wordsLimit}
            onChangeWords={setWords}
            onPrevious={goToInfo}
            onNext={goToReview}
          />
        )}
        {step === 'review' && (
          <ReviewSummaryStep
            form={{ ...form, words }}
            isSaving={isSaving}
            onEditInfo={goToInfo}
            onEditWords={goToLocations}
            onSave={handleSaveLesson}
          />
        )}
      </View>

      {isSaving && (
        <View className="absolute inset-0 items-center justify-center bg-black/10">
          <View className="rounded-2xl bg-white p-6 shadow-xl">
            <ActivityIndicator size="large" color="#000" />
          </View>
        </View>
      )}

      <ActionSheet
        isVisible={isExitSheetVisible}
        onClose={() => setIsExitSheetVisible(false)}
        onAction={exit}
        title="Exit create mode?"
        description="Are you sure you want to stop? Your progress will not be saved."
        actionLabel="Exit"
        variant="destructive"
        Icon={LogOut}
      />
    </View>
  );
};
