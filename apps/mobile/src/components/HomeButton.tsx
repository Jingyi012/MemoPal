import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import React from 'react';
import AnimatedPressable from './AnimatedPressable';

const HomeButton = () => {
  const router = useRouter();
  return (
    <AnimatedPressable
      accessibilityLabel="Go to home"
      onPress={() => router.dismissAll()}
      className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
      <Home size={20} color="white" />
    </AnimatedPressable>
  );
};

export default HomeButton;
