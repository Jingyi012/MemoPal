import PalaceMemorySessionScreen from '@/features/palace-scenes/screens/PalaceMemorySessionScreen';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function PalaceMemoryRoute() {
  const params = useLocalSearchParams<{
    memorySetId?: string | string[];
    restart?: string | string[];
    mode?: string | string[];
    returnTo?: string | string[];
  }>();
  const memorySetId = Array.isArray(params.memorySetId) ? params.memorySetId[0] : params.memorySetId;
  const restart = (Array.isArray(params.restart) ? params.restart[0] : params.restart) === '1';
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const returnToParam = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = returnToParam === 'practice' || returnToParam === 'palaces' ? returnToParam : undefined;
  if (!memorySetId) return <Redirect href="/palaces" />;
  return <PalaceMemorySessionScreen memorySetId={memorySetId} restart={restart} startInRecall={mode === 'recall'} returnTo={returnTo} />;
}
