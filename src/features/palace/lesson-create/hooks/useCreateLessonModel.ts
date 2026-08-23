import { useLessonList, useLessonMutations } from '@/features/palace/shared/hooks';
import { useFeatureLimits } from '@/features/subscription/hooks/useFeatureLimits';
import type { LessonForm, LessonWordForm } from '@/features/palace/shared/types/lesson.types';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import Toast from 'react-native-toast-message';

export type CreateLessonStep = 'info' | 'locations' | 'review';

export const CREATE_LESSON_STEPS: { key: CreateLessonStep; label: string }[] = [
  { key: 'info', label: 'General Info' },
  { key: 'locations', label: 'Add Words' },
  { key: 'review', label: 'Review' },
];

type Props = {
  palaceId: string;
};

export function useCreateLessonModel({ palaceId }: Props) {
  const router = useRouter();
  const { limits, isLoading: isLoadingLimits } = useFeatureLimits();
  const { data: lessons = [] } = useLessonList(palaceId);
  const { saveLesson } = useLessonMutations(palaceId);

  const [step, setStep] = useState<CreateLessonStep>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isExitSheetVisible, setIsExitSheetVisible] = useState(false);
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

  const lessonLimit = limits.customLessonsPerPalace;
  const wordsLimit = limits.customWordsPerLesson;
  const isLessonLimitReached = lessons.length >= lessonLimit;
  const currentStepIndex = CREATE_LESSON_STEPS.findIndex(({ key }) => key === step);

  const goToInfo = useCallback(() => setStep('info'), []);
  const goToLocations = useCallback(() => setStep('locations'), []);
  const goToReview = useCallback(() => setStep('review'), []);
  const exit = useCallback(() => router.back(), [router]);

  const handleSaveLesson = useCallback(async () => {
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
      await saveLesson.mutateAsync({ ...form, words });
      Toast.show({
        type: 'success',
        text1: 'Lesson Saved!',
        text2: 'Your memory palace has been updated.',
      });
      router.back();
    } catch (error: unknown) {
      console.error('Failed to save lesson:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    form,
    isLessonLimitReached,
    isSaving,
    lessonLimit,
    lessons.length,
    router,
    saveLesson,
    words,
    wordsLimit,
  ]);

  return useMemo(
    () => ({
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
    }),
    [
      currentStepIndex,
      exit,
      form,
      goToInfo,
      goToLocations,
      goToReview,
      handleSaveLesson,
      isExitSheetVisible,
      isLessonLimitReached,
      isLoadingLimits,
      isSaving,
      lessonLimit,
      lessons,
      setForm,
      setIsExitSheetVisible,
      setWords,
      step,
      words,
      wordsLimit,
    ]
  );
}
