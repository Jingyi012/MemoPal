import { ActionSheet } from '@/components/ActionSheet';
import { CommonHeader } from '@/components/CommonHeader';
import { SegmentedProgressBar } from '@/components/SegmentedProgressBar';
import { useFeatureLimits } from '@/hooks/useFeatureLimits';
import { useLessonList, useLessonMutations } from '@/hooks/useLessonsManager';
import { LessonForm, LessonWordForm } from '@/types/lesson';
import { useRouter } from 'expo-router';
import { LogOut, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { LessonInfoStep } from './LessonInfoStep';
import { LocationCanvasStep } from './LocationCanvasStep';
import { ReviewSummaryStep } from './ReviewSummaryStep';

interface Props {
  palaceId: string;
}

type CreateLessonStep = 'info' | 'locations' | 'review';

const STEPS: { key: CreateLessonStep; label: string }[] = [
  { key: 'info', label: 'General Info' },
  { key: 'locations', label: 'Add Words' },
  { key: 'review', label: 'Review' },
];

export const CreateLessonScreen: React.FC<Props> = ({ palaceId }) => {
  const router = useRouter();
  const { limits, isLoading: isLoadingLimits } = useFeatureLimits();
  const { data: lessons = [] } = useLessonList(palaceId);

  const { saveLesson } = useLessonMutations(palaceId);
  const lessonLimit = limits.customLessonsPerPalace;
  const wordsLimit = limits.customWordsPerLesson;
  const isLessonLimitReached = lessons.length >= lessonLimit;

  const [step, setStep] = useState<CreateLessonStep>('info');
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<Omit<LessonForm, 'words'>>({
    palaceId,
    title: '',
    description: '',
    category: 'general',
    tag: [],
    privacy: 'private',
    isCustom: true,
  });

  const [words, setWords] = useState<LessonWordForm[]>([]);
  const [isDeleteSheetVisible, setIsDeleteSheetVisible] = useState<boolean>(false);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleSaveLesson = async () => {
    if (isSaving) return;
    if (isLessonLimitReached) {
      Toast.show({
        type: 'error',
        text1: 'Lesson limit reached',
        text2: `This palace already has ${lessons.length}/${lessonLimit} custom lessons.`,
      });
      return;
    }
    if (words.length > wordsLimit) {
      Toast.show({
        type: 'error',
        text1: 'Word limit reached',
        text2: `You can add up to ${wordsLimit} words in one custom lesson.`,
      });
      return;
    }

    try {
      setIsSaving(true);
      // Combine form data with words collected in the Canvas step
      await saveLesson.mutateAsync({
        ...form,
        words,
      });

      Toast.show({
        type: 'success',
        text1: 'Lesson Saved!',
        text2: 'Your memory palace has been updated.',
      });

      router.back();
    } catch (error: unknown) {
      console.error('Failed to save lesson:', error);
      const message = error instanceof Error ? error.message : 'Please try again';
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: message || 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
        <CommonHeader
          title="Create Lesson"
          hideBackButton={false}
          backAction={() => router.back()}
        />
        <View className="p-5">
          <Text className="text-amber-700">
            Lesson limit reached for this palace ({lessons.length}/{lessonLimit}).
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
        hideBackButton={true}
        actions={[
          {
            icon: X,
            onPress: () => {
              setIsDeleteSheetVisible(true);
            },
          },
        ]}
        additionalContent={
          <View className="mt-2">
            <SegmentedProgressBar
              total={STEPS.length}
              current={currentStepIndex}
              label={STEPS[currentStepIndex].label}
            />
          </View>
        }
      />

      {/* Steps Logic */}
      <View className="flex-1">
        {step === 'info' && (
          <LessonInfoStep value={form} onChange={setForm} onNext={() => setStep('locations')} />
        )}

        {step === 'locations' && (
          <LocationCanvasStep
            palaceId={palaceId}
            words={words}
            wordsLimit={wordsLimit}
            onChangeWords={setWords}
            onPrevious={() => setStep('info')}
            onNext={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <ReviewSummaryStep
            form={{ ...form, words }}
            isSaving={isSaving}
            onEditInfo={() => setStep('info')}
            onEditWords={() => setStep('locations')}
            onSave={handleSaveLesson}
          />
        )}
      </View>

      {/* Global Saving Overlay */}
      {isSaving && (
        <View className="absolute inset-0 items-center justify-center bg-black/10">
          <View className="rounded-2xl bg-white p-6 shadow-xl">
            <ActivityIndicator size="large" color="#000" />
          </View>
        </View>
      )}

      <ActionSheet
        isVisible={isDeleteSheetVisible}
        onClose={() => setIsDeleteSheetVisible(false)}
        onAction={() => router.back()}
        title="Exit create mode?"
        description="Are you sure you want to stop? Your progress will not be saved."
        actionLabel="Exit"
        variant="destructive"
        Icon={LogOut}
      />
    </View>
  );
};
