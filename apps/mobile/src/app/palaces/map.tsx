import LoadingView from '@/components/LoadingView';
import { useMemoryModuleAccess } from '@/core/memory';
import { PalaceMapScreen } from '@/features/palace-scenes';
import { Href, Redirect } from 'expo-router';

export default function PalaceMapRoute() {
  const { enabled, isLoading } = useMemoryModuleAccess('palace');

  if (isLoading) return <LoadingView />;
  if (!enabled) return <Redirect href={'/memory-tools' as Href} />;

  return <PalaceMapScreen />;
}
