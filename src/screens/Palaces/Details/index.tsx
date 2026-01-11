import { CommonHeader } from '@/components/CommonHeader';
import TutorialPromptCard from '@/components/PromptCard/TutorialPromptCard';
import { Lesson } from '@/types/lesson';
import data from '@/utils/mock/lessonsList.json';
import palaceData from '@/utils/mock/palaces.json';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { CustomLessonList } from './CustomLessonsList';
import { ReviewPalaceButton } from './ReviewPalaceButton';
import { WordLessonList } from './WordLessonsList';

interface PalaceViewProps {
  palaceId: string;
}

const PalaceDetailScreen: React.FC<PalaceViewProps> = ({ palaceId }) => {
  const router = useRouter();
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(true);
  const lessons = data.lessons;

  const customLessons = lessons.filter((x) => x.isCustom === true);
  const wordLessons = lessons.filter((x) => x.isCustom === false);

  const palaces = palaceData.palaces;
  const palace = palaces.find((x) => x.id === palaceId)!;

  return (
    <>
      <CommonHeader
        title={palace.name}
        description={
          <Text className="text-sm text-teal-100">
            {palace?.locations} locations • {1} lessons completed
          </Text>
        }
        backAction={() => router.replace(`/(tabs)/palaces`)}
        showNotification
      />
      <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {showTutorialPrompt && (
          <TutorialPromptCard dismissTutorialPrompt={() => setShowTutorialPrompt(false)} />
        )}
        <ReviewPalaceButton
          onStartPalaceTraining={() => router.push(`/palaces/${palaceId}/training`)}
        />

        <CustomLessonList palaceId={palaceId} lessons={customLessons as Lesson[]} />

        <WordLessonList lessons={wordLessons as Lesson[]} />
      </ScrollView>
    </>
  );
};

export default PalaceDetailScreen;
