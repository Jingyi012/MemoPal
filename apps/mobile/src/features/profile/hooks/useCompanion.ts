import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { companionApi } from '../api/companion.api';
import type { CreateCompanionPresetInput, SaveCompanionLookInput } from '../api/companion.api';

export const COMPANION_KEYS = { all: ['companion'] as const };
export const COMPANION_PRESET_KEYS = { all: ['companion-presets'] as const };

export function useCompanion() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: [...COMPANION_KEYS.all, user?.id],
    queryFn: companionApi.getStatus,
    enabled: Boolean(user),
    staleTime: 30_000,
    networkMode: 'online',
  });
}

export function useGreetCompanion() {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: companionApi.greet,
    onSuccess: (status) => client.setQueryData([...COMPANION_KEYS.all, user?.id], status),
    retry: false,
    networkMode: 'online',
  });
}

export function useSaveCompanionLook() {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: (input: SaveCompanionLookInput) => companionApi.saveLook(input),
    onSuccess: (status) => client.setQueryData([...COMPANION_KEYS.all, user?.id], status),
    retry: false,
    networkMode: 'online',
  });
}

export function useCompanionPresets() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: [...COMPANION_PRESET_KEYS.all, user?.id],
    queryFn: companionApi.getPresets,
    enabled: Boolean(user),
    staleTime: 30_000,
    networkMode: 'online',
  });
}

export function useCreateCompanionPreset() {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: (input: CreateCompanionPresetInput) => companionApi.createPreset(input),
    onSuccess: () => client.invalidateQueries({ queryKey: [...COMPANION_PRESET_KEYS.all, user?.id] }),
    retry: false,
    networkMode: 'online',
  });
}

export function useEquipCompanionPreset() {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: companionApi.equipPreset,
    onSuccess: (status) => {
      client.setQueryData([...COMPANION_KEYS.all, user?.id], status);
      client.invalidateQueries({ queryKey: [...COMPANION_PRESET_KEYS.all, user?.id] });
    },
    retry: false,
    networkMode: 'online',
  });
}

export function useDeleteCompanionPreset() {
  const client = useQueryClient();
  const { user } = useCurrentUser();
  return useMutation({
    mutationFn: companionApi.deletePreset,
    onSuccess: () => client.invalidateQueries({ queryKey: [...COMPANION_PRESET_KEYS.all, user?.id] }),
    retry: false,
    networkMode: 'online',
  });
}
