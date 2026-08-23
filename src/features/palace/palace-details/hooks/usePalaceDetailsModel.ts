import { useUserState } from '@/contexts/UserStateContext';
import { useLessonList, usePalace } from '@/features/palace/shared/hooks';
import type { Lesson } from '@/features/palace/shared/types/lesson.types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type PalaceLessonTab = 'word' | 'custom';

type Props = {
  palaceId: string;
};

export function usePalaceDetailsModel({ palaceId }: Props) {
  const router = useRouter();
  const { userState, updateState } = useUserState();
  const [activeTab, setActiveTab] = useState<PalaceLessonTab>('word');

  const {
    data: palaceData,
    isLoading: palaceLoading,
    isRefetching: isPalaceRefetching,
    refetch: palaceRefetch,
  } = usePalace(palaceId);
  const {
    data: lessons = [],
    isLoading: lessonsLoading,
    isRefetching: isLessonDetailRefetching,
    refetch: lessonsRefetch,
  } = useLessonList(palaceId);

  const customLessons = useMemo(() => lessons.filter((lesson) => lesson.isCustom), [lessons]);
  const wordLessons = useMemo(() => lessons.filter((lesson) => !lesson.isCustom), [lessons]);

  useEffect(() => {
    if (palaceData?.isCustom) {
      setActiveTab('custom');
    } else {
      setActiveTab((current) => (current === 'custom' ? 'custom' : 'word'));
    }
  }, [palaceData?.isCustom]);

  const onRefresh = useCallback(async () => {
    await Promise.all([palaceRefetch(), lessonsRefetch()]);
  }, [lessonsRefetch, palaceRefetch]);

  const handleBack = useCallback(() => {
    router.replace('/palaces');
  }, [router]);

  const handleStartPalaceTraining = useCallback(() => {
    router.push(`/palaces/${palaceId}/training`);
  }, [palaceId, router]);

  const dismissTutorialPrompt = useCallback(() => {
    void updateState({ ui: { ...userState.ui, tutorialPromptDismissed: true } });
  }, [updateState, userState.ui]);

  const viewTutorial = useCallback(() => {
    void updateState({
      ui: {
        ...userState.ui,
        tutorialPromptDismissed: true,
        tutorialViewedAt: new Date().toISOString(),
      },
    });
  }, [updateState, userState.ui]);

  return {
    palaceData,
    lessons,
    customLessons,
    wordLessons,
    activeTab,
    setActiveTab,
    isLoading: palaceLoading || lessonsLoading || !palaceData,
    isRefreshing: isPalaceRefetching || isLessonDetailRefetching,
    onRefresh,
    handleBack,
    handleStartPalaceTraining,
    showTutorialPrompt: !userState.ui.tutorialPromptDismissed,
    dismissTutorialPrompt,
    viewTutorial,
  };
}

export type PalaceDetailsLessonLists = {
  customLessons: Lesson[];
  wordLessons: Lesson[];
};
