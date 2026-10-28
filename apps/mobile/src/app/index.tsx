import { useAuth } from '@/contexts/AuthProvider';
import { Redirect } from 'expo-router';
import React from 'react';

export default function RootIndex() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const isLocalDevMode =
    String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated && !isLocalDevMode) return <Redirect href="/login" />;

  const needsOnboarding = user?.onboardingStatus === 'in-progress';
  return <Redirect href={needsOnboarding ? '/onboarding' : '/(tabs)'} />;
}
