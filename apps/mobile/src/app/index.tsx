import { useAuth } from '@/contexts/AuthProvider';
import { Redirect } from 'expo-router';
import React from 'react';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />;
}
