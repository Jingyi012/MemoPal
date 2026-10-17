import LoadingView from '@/components/LoadingView';
import { useMemoryModuleAccess } from '@/core/memory';
import { PalaceJourneysScreen } from '@/features/palace-scenes';
import { Href, Redirect } from 'expo-router';

export default function PalaceJourneysRoute() {
  const { enabled, isLoading } = useMemoryModuleAccess('palace');
  if (isLoading) return <LoadingView />;
  if (!enabled) return <Redirect href={'/(tabs)/practice' as Href} />;
  return <PalaceJourneysScreen />;
}
