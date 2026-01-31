import { Step } from '@/types/application';
import React from 'react';
import { Text, View } from 'react-native';
import { StepCard } from './StepCard';

const LearningPath: React.FC = () => {
  const steps: Step[] = [
    {
      id: 1,
      title: 'Master Your Palace',
      description:
        'Learn 10 locations in your first Memory Palace - your familiar home environment',
      progress: { current: 0, total: 10 },
    },
    {
      id: 2,
      title: 'Learn Your First Words',
      description: 'Apply the Memory Palace technique to remember 10 words',
      isLocked: true,
    },
    {
      id: 3,
      title: 'Build Your Streak',
      description: 'Review daily and earn your first achievement badge',
      isLocked: true,
    },
  ];

  return (
    <View className="mt-6">
      <Text className="text-text">What You'll Learn</Text>
      {steps.map((step) => (
        <StepCard key={step.id} step={step} />
      ))}
    </View>
  );
};

export default LearningPath;
