import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useLessonList } from '@/hooks/useLessonsManager';
import { usePalace } from '@/hooks/usePalace';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text } from 'react-native';
import { CustomLessonList } from './CustomLessonsList';
import { ReviewPalaceButton } from './ReviewPalaceButton';
import { WordLessonList } from './WordLessonsList';

interface PalaceViewProps {
  palaceId: string;
}

const PalaceDetailScreen: React.FC<PalaceViewProps> = ({ palaceId }) => {
  const router = useRouter();
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(true);

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

  if (palaceLoading || lessonsLoading || !palaceData) {
    return <LoadingView />;
  }

  const isRefreshing = isPalaceRefetching || isLessonDetailRefetching;

  const onRefresh = async () => {
    await palaceRefetch();
    await refetch();
  };

  const customLessons = useMemo(() => lessons.filter((l) => l.isCustom), [lessons]);
  const wordLessons = useMemo(() => lessons.filter((l) => !l.isCustom), [lessons]);

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
        {showTutorialPrompt && (
          <TutorialPromptCard dismissTutorialPrompt={() => setShowTutorialPrompt(false)} />
        )}
        <ReviewPalaceButton
          locationCount={palaceData.locationsCount}
          onStartPalaceTraining={() => router.push(`/palaces/${palaceId}/training`)}
        />
        <CustomLessonList palaceId={palaceId} lessons={customLessons} />
        <WordLessonList lessons={wordLessons} />
      </ScrollView>
    </>
  );
};

export default PalaceDetailScreen;
