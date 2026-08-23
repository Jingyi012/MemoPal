import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { usePalaceDetailsModel } from '@/features/palace/palace-details/hooks/usePalaceDetailsModel';
import { CustomLessonList } from '@/features/palace/palace-details/components/PalaceDetailsCustomLessons';
import { ReviewPalaceButton } from '@/features/palace/palace-details/components/PalaceDetailsReviewButton';
import { WordLessonList } from '@/features/palace/palace-details/components/PalaceDetailsWordLessons';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

interface PalaceDetailsProps {
  palaceId: string;
}

const PalaceDetailsScreen: React.FC<PalaceDetailsProps> = ({ palaceId }) => {
  const {
    palaceData,
    lessons,
    customLessons,
    wordLessons,
    activeTab,
    setActiveTab,
    isLoading,
    isRefreshing,
    onRefresh,
    handleBack,
    handleStartPalaceTraining,
    showTutorialPrompt,
    dismissTutorialPrompt,
    viewTutorial,
  } = usePalaceDetailsModel({ palaceId });

  if (isLoading || !palaceData) {
    return <LoadingView />;
  }

  return (
    <>
      <CommonHeader
        title={palaceData.name}
        description={
          <Text className="text-sm text-teal-100">
            {palaceData.locationsCount} locations • {lessons.length} lessons
          </Text>
        }
        backAction={handleBack}
        showNotification
      />

      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        {showTutorialPrompt && (
          <TutorialPromptCard
            dismissTutorialPrompt={dismissTutorialPrompt}
            onViewTutorial={viewTutorial}
          />
        )}

        <ReviewPalaceButton
          locationCount={palaceData.locationsCount}
          onStartPalaceTraining={handleStartPalaceTraining}
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

export default PalaceDetailsScreen;
