import { LessonDetailsScreen as LessonDetailScreen } from '@/features/palace';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const LessonDetail = () => {
  const { id } = useLocalSearchParams();
  return <LessonDetailScreen lessonId={id as string} />;
};

export default LessonDetail;
