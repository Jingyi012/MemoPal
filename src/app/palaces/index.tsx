import { useMemoryModuleAccess } from '@/core/memory';
import { PalaceListScreen } from '@/features/palace';
import LoadingView from '@/components/LoadingView';
import { Href, Redirect } from 'expo-router';

export default function PalacesRoute() {
  const { enabled, isLoading } = useMemoryModuleAccess('palace');

  if (isLoading) return <LoadingView />;
  if (!enabled) return <Redirect href={'/(tabs)/practice' as Href} />;

  return <PalaceListScreen />;
}
