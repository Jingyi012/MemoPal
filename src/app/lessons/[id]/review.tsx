import { ReviewTest } from '@/screens/Lesson/Reviewing';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const ReviewScreen = () => {
  const { id } = useLocalSearchParams();
  return <ReviewTest lessonId={id as string} />;
};

export default ReviewScreen;
