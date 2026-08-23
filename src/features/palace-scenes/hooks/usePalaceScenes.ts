import { useQuery } from '@tanstack/react-query';
import { palaceSceneApi } from '../api/palaceScene.api';

export const PALACE_SCENE_KEYS = {
  all: ['palace-scenes'] as const,
  list: () => [...PALACE_SCENE_KEYS.all, 'list'] as const,
  detail: (sceneId: string) => [...PALACE_SCENE_KEYS.all, 'detail', sceneId] as const,
};

export function usePalaceScenes() {
  return useQuery({
    queryKey: PALACE_SCENE_KEYS.list(),
    queryFn: palaceSceneApi.getAll,
    staleTime: 1000 * 60 * 10,
    networkMode: 'online',
  });
}

export function usePalaceScene(sceneId: string) {
  return useQuery({
    queryKey: PALACE_SCENE_KEYS.detail(sceneId),
    queryFn: () => palaceSceneApi.getById(sceneId),
    enabled: Boolean(sceneId),
    networkMode: 'online',
  });
}
