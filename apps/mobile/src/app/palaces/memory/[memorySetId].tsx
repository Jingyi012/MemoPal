import PalaceMemorySessionScreen from '@/features/palace-scenes/screens/PalaceMemorySessionScreen';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function PalaceMemoryRoute() {
  const params = useLocalSearchParams<{
    memorySetId?: string | string[];
    restart?: string | string[];
    mode?: string | string[];
  }>();
  const memorySetId = Array.isArray(params.memorySetId) ? params.memorySetId[0] : params.memorySetId;
  const restart = (Array.isArray(params.restart) ? params.restart[0] : params.restart) === '1';
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  if (!memorySetId) return <Redirect href="/palaces" />;
  return <PalaceMemorySessionScreen memorySetId={memorySetId} restart={restart} startInRecall={mode === 'recall'} />;
}
