import { LearnLessonScreen } from '@/screens/Lesson/Learning';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const LearnLesson = () => {
  const { id } = useLocalSearchParams();
  return <LearnLessonScreen lessonId={id as string} />;
};

export default LearnLesson;
