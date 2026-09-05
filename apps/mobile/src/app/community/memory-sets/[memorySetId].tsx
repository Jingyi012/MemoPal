import { PublicMemorySetDetailScreen } from '@/features/library/screens/PublicMemorySetDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function PublicMemorySetRoute() {
  const { memorySetId } = useLocalSearchParams<{ memorySetId: string }>();
  return <PublicMemorySetDetailScreen memorySetId={memorySetId ?? ''} />;
}
