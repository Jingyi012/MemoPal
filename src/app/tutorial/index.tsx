import { TutorialScreen } from '@/features/tutorial';
import { useRouter } from 'expo-router';
import React from 'react';

const Tutorial: React.FC = () => {
  const router = useRouter();
  return <TutorialScreen onBack={() => router.back()} onFinish={() => router.back()} />;
};

export default Tutorial;
