import { PALACE_SCENE_KEYS } from './usePalaceScenes';
import { palaceSceneApi } from '../api/palaceScene.api';
import type { PalaceSceneUpsertRequest } from '../types/palaceScene.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function usePalaceSceneMutations() {
  const queryClient = useQueryClient();

  const invalidate = async (sceneId?: string) => {
    await queryClient.invalidateQueries({ queryKey: PALACE_SCENE_KEYS.list() });
    if (sceneId) {
      await queryClient.invalidateQueries({ queryKey: PALACE_SCENE_KEYS.detail(sceneId) });
    }
  };

  const createCustom = useMutation({
    mutationFn: (request: PalaceSceneUpsertRequest) => palaceSceneApi.createCustom(request),
    onSuccess: () => invalidate(),
  });
  const updateCustom = useMutation({
    mutationFn: ({ sceneId, request }: { sceneId: string; request: PalaceSceneUpsertRequest }) =>
      palaceSceneApi.updateCustom(sceneId, request),
    onSuccess: (scene) => invalidate(scene.id),
  });
  const deleteCustom = useMutation({
    mutationFn: (sceneId: string) => palaceSceneApi.deleteCustom(sceneId),
    onSuccess: () => invalidate(),
  });

  return { createCustom, updateCustom, deleteCustom };
}
