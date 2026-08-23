import { LearnLessonScreen } from '@/features/palace';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const LearnLesson = () => {
  const { id } = useLocalSearchParams();
  return <LearnLessonScreen lessonId={id as string} />;
};

export default LearnLesson;
