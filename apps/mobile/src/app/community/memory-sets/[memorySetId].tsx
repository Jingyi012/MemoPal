import { PublicMemorySetDetailScreen } from '@/features/library/screens/PublicMemorySetDetailScreen';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';

export default function PublicMemorySetRoute() {
  const { memorySetId } = useLocalSearchParams<{ memorySetId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Redirect href={{ pathname: '/login', params: { returnTo: `/community/memory-sets/${encodeURIComponent(memorySetId ?? '')}` } }} />;
  }
  return <PublicMemorySetDetailScreen memorySetId={memorySetId ?? ''} />;
}
