import LoadingView from '@/components/LoadingView';
import { useMemoryModuleAccess } from '@/core/memory';
import { NumberPegHomeScreen } from '@/features/number-peg';
import { Href, Redirect } from 'expo-router';

export default function NumberPegRoute() {
  const { enabled, isLoading } = useMemoryModuleAccess('number-peg');

  if (isLoading) return <LoadingView />;
  if (!enabled) return <Redirect href={'/(tabs)/practice' as Href} />;

  return <NumberPegHomeScreen />;
}
