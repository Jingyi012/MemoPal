import NumberPegSessionScreen from '@/features/number-peg/screens/NumberPegSessionScreen';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function NumberPegSessionRoute() {
  const params = useLocalSearchParams<{ memorySetId?: string | string[]; restart?: string | string[] }>();
  const memorySetId = Array.isArray(params.memorySetId) ? params.memorySetId[0] : params.memorySetId;
  const restart = (Array.isArray(params.restart) ? params.restart[0] : params.restart) === '1';

  if (!memorySetId) return <Redirect href="/number-peg" />;
  return <NumberPegSessionScreen memorySetId={memorySetId} restart={restart} />;
}
