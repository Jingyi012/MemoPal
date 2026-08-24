import { useAuth } from '@/contexts/AuthProvider';
import { Redirect } from 'expo-router';
import React from 'react';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();
  const isLocalDevMode =
    String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';

  if (isLoading) {
    return null;
  }

  return <Redirect href={isAuthenticated || isLocalDevMode ? '/(tabs)' : '/login'} />;
}
