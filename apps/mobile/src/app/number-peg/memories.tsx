import LoadingView from '@/components/LoadingView';
import { useMemoryModuleAccess } from '@/core/memory';
import { NumberPegMemoriesScreen } from '@/features/number-peg';
import { Href, Redirect } from 'expo-router';

export default function NumberPegMemoriesRoute() {
  const { enabled, isLoading } = useMemoryModuleAccess('number-peg');
  if (isLoading) return <LoadingView />;
  if (!enabled) return <Redirect href={'/memory-tools' as Href} />;
  return <NumberPegMemoriesScreen />;
}
