import { CreateLessonScreen } from '@/features/palace';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

const CreateLesson = () => {
  const { palaceId } = useLocalSearchParams();
  return <CreateLessonScreen palaceId={palaceId as string} />;
};

export default CreateLesson;
