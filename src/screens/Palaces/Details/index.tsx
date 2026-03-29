import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { useUserState } from '@/contexts/UserStateContext';
import { useLessonList } from '@/hooks/useLessonsManager';
import { usePalace } from '@/hooks/usePalace';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { CustomLessonList } from './CustomLessonsList';
import { ReviewPalaceButton } from './ReviewPalaceButton';
import { WordLessonList } from './WordLessonsList';

interface PalaceViewProps {
  palaceId: string;
}

type LessonTabKey = 'word' | 'custom';

const PalaceDetailScreen: React.FC<PalaceViewProps> = ({ palaceId }) => {
  const router = useRouter();
  const { userState, updateState } = useUserState();
  const [activeTab, setActiveTab] = useState<LessonTabKey>('word');

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

  useEffect(() => {
    if (palaceData?.isCustom) {
      setActiveTab('custom');
    } else {
      setActiveTab((current) => (current === 'custom' ? 'custom' : 'word'));
    }
  }, [palaceData?.isCustom]);

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

        <View className="mt-6 flex-row rounded-2xl bg-slate-200 p-1">
          {!palaceData.isCustom ? (
            <Pressable
              onPress={() => setActiveTab('word')}
              className={`flex-1 rounded-xl px-4 py-2 ${activeTab === 'word' ? 'bg-white' : 'bg-transparent'}`}>
              <Text
                className={`text-center text-sm font-semibold ${
                  activeTab === 'word' ? 'text-slate-900' : 'text-slate-600'
                }`}>
                Word Lessons ({wordLessons.length})
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setActiveTab('custom')}
            className={`${palaceData.isCustom ? 'w-full' : 'flex-1'} rounded-xl px-4 py-2 ${
              activeTab === 'custom' ? 'bg-white' : 'bg-transparent'
            }`}>
            <Text
              className={`text-center text-sm font-semibold ${
                activeTab === 'custom' ? 'text-slate-900' : 'text-slate-600'
              }`}>
              Custom Lessons ({customLessons.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'custom' && <CustomLessonList palaceId={palaceId} lessons={customLessons} />}
        {!palaceData.isCustom && activeTab === 'word' && <WordLessonList lessons={wordLessons} />}
      </ScrollView>
    </>
  );
};

export default PalaceDetailScreen;
