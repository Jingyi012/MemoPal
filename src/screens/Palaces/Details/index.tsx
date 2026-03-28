import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useLessonList } from '@/hooks/useLessonsManager';
import { usePalace } from '@/hooks/usePalace';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, Text } from 'react-native';
import { CustomLessonList } from './CustomLessonsList';
import { ReviewPalaceButton } from './ReviewPalaceButton';
import { WordLessonList } from './WordLessonsList';

interface PalaceViewProps {
  palaceId: string;
}

const PalaceDetailScreen: React.FC<PalaceViewProps> = ({ palaceId }) => {
  const router = useRouter();
  const { userState, updateState } = useUserState();

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
    refetch,
  } = useLessonList(palaceId);
  const customLessons = useMemo(() => lessons.filter((l) => l.isCustom), [lessons]);
  const wordLessons = useMemo(() => lessons.filter((l) => !l.isCustom), [lessons]);

  if (palaceLoading || lessonsLoading || !palaceData) {
    return <LoadingView />;
  }

  const isRefreshing = isPalaceRefetching || isLessonDetailRefetching;

  const onRefresh = async () => {
    await palaceRefetch();
    await refetch();
  };

  return (
    <>
      <CommonHeader
        title={palaceData.name}
        description={
          <Text className="text-sm text-teal-100">
            {palaceData.locationsCount} locations • {lessons.length} lessons
          </Text>
        }
        backAction={() => router.replace(`/(tabs)/palaces`)}
        showNotification
      />
      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {!userState.ui.tutorialPromptDismissed && (
          <TutorialPromptCard
            dismissTutorialPrompt={() =>
              updateState({ ui: { ...userState.ui, tutorialPromptDismissed: true } })
            }
            onViewTutorial={() =>
              updateState({
                ui: {
                  ...userState.ui,
                  tutorialPromptDismissed: true,
                  tutorialViewedAt: new Date().toISOString(),
                },
              })
            }
          />
        )}
        <ReviewPalaceButton
          locationCount={palaceData.locationsCount}
          onStartPalaceTraining={() => router.push(`/palaces/${palaceId}/training`)}
        />
        <CustomLessonList palaceId={palaceId} lessons={customLessons} />
        {!palaceData.isCustom && <WordLessonList lessons={wordLessons} />}
      </ScrollView>
    </>
  );
};

export default PalaceDetailScreen;
