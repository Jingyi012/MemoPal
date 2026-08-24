import MemorySetDetailScreen from '@/features/memory-sets/screens/MemorySetDetailScreen';
import { useLocalSearchParams } from 'expo-router';

export default function MemorySetDetailRoute() {
  const { memorySetId } = useLocalSearchParams<{ memorySetId: string }>();
  return <MemorySetDetailScreen memorySetId={memorySetId} />;
}
