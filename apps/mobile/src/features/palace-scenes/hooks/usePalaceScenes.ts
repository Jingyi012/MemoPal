import { useQuery } from '@tanstack/react-query';
import {
  isLocalPreviewEnabled,
  LOCAL_PREVIEW_SCENES,
} from '@/core/dev/localPreviewData';
import { palaceSceneApi } from '../api/palaceScene.api';

export const PALACE_SCENE_KEYS = {
  all: ['palace-scenes'] as const,
  list: () => [...PALACE_SCENE_KEYS.all, 'list'] as const,
  detail: (sceneId: string) => [...PALACE_SCENE_KEYS.all, 'detail', sceneId] as const,
};

export function usePalaceScenes() {
  return useQuery({
    queryKey: PALACE_SCENE_KEYS.list(),
    queryFn: async () => {
      try {
        return await palaceSceneApi.getAll();
      } catch (error) {
        if (!isLocalPreviewEnabled) throw error;
        return LOCAL_PREVIEW_SCENES;
      }
    },
    staleTime: 1000 * 60 * 10,
    networkMode: 'online',
  });
}

export function usePalaceScene(sceneId: string) {
  return useQuery({
    queryKey: PALACE_SCENE_KEYS.detail(sceneId),
    queryFn: async () => {
      try {
        return await palaceSceneApi.getById(sceneId);
      } catch (error) {
        if (isLocalPreviewEnabled) {
          const previewScene = LOCAL_PREVIEW_SCENES.find((scene) => scene.id === sceneId);
          if (previewScene) return previewScene;
        }
        throw error;
      }
    },
    enabled: Boolean(sceneId),
    networkMode: 'online',
  });
}
