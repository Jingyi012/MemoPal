import MemoryComposerScreen from '@/features/memory-composer/screens/MemoryComposerScreen';
import { firstParam } from '@/features/memory-composer/utils/composerParams';
import { useLocalSearchParams } from 'expo-router';

export default function PalaceCreateMemoryRoute() {
  const params = useLocalSearchParams<{ sceneId?: string | string[] }>();
  return <MemoryComposerScreen initialTechnique="palace" initialSceneId={firstParam(params.sceneId)} />;
}
