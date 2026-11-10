import { Redirect, useLocalSearchParams } from 'expo-router';
import MemoryReviewSessionScreen from '@/features/practice-attempts/screens/MemoryReviewSessionScreen';
import { useAuth } from '@/contexts/AuthProvider';

export default function MemoryReviewRoute() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ memorySetId?: string | string[]; scope?: string | string[] }>();
  const id = Array.isArray(params.memorySetId) ? params.memorySetId[0] : params.memorySetId;
  const value = Array.isArray(params.scope) ? params.scope[0] : params.scope;
  const scope = value === 'learn' || value === 'browse' ? value : 'due';
  if (!id) return <Redirect href="/memory-tools" />;
  return <MemoryReviewSessionScreen key={`${id}:${scope}:${user?.id}`} memorySetId={id} scope={scope} />;
}
