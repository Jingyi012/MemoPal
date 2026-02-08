import { ReviewTest } from '@/screens/Lesson/Reviewing';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const ReviewScreen = () => {
  const { id, isLearningMode } = useLocalSearchParams();
  return (
    <ReviewTest lessonId={id as string} isLearningMode={isLearningMode as unknown as boolean} />
  );
};

export default ReviewScreen;
