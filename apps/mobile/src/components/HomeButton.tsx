import { useRouter } from 'expo-router';
import { Home } from '@/core/icons';
import React from 'react';
import { HeaderIconButton } from './ui/HeaderIconButton';

const HomeButton = () => {
  const router = useRouter();
  return (
    <HeaderIconButton
      icon={Home}
      accessibilityLabel="Go to home"
      onPress={() => router.dismissAll()}
    />
  );
};

export default HomeButton;
