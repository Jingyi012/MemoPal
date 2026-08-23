import * as locationService from '@/features/palace/shared/services/location.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const LOCATION_KEYS = {
  all: ['locations'] as const,
  byPalace: (palaceId: string) => [...LOCATION_KEYS.all, 'palace', palaceId] as const,
  detail: (id: string) => [...LOCATION_KEYS.all, 'detail', id] as const,
};

export const useLocation = (locationId: string) => {
  const query = useQuery({
    queryKey: LOCATION_KEYS.detail(locationId),
    queryFn: () => locationService.getLocation(locationId),
    enabled: !!locationId,
    staleTime: 1000 * 60 * 5,
  });

  return { location: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
};

export const useLocationsByPalace = (palaceId: string) => {
  const query = useQuery({
    queryKey: LOCATION_KEYS.byPalace(palaceId),
    queryFn: () => locationService.getLocationsByPalace(palaceId),
    enabled: !!palaceId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    locations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useLocationMutations = (palaceId?: string) => {
  const queryClient = useQueryClient();
  const invalidatePalaceLocations = (id?: string) => {
    if (id) queryClient.invalidateQueries({ queryKey: LOCATION_KEYS.byPalace(id) });
  };

  const createLocation = useMutation({
    mutationFn: (location: any) => locationService.createLocation(location),
    onSuccess: (_, variables) => invalidatePalaceLocations(variables?.palaceId ?? palaceId),
  });
  const updateLocation = useMutation({
    mutationFn: ({ id, ...location }: any) => locationService.updateLocation(id, location),
    onSuccess: (_, variables) => invalidatePalaceLocations(variables?.palaceId ?? palaceId),
  });
  const deleteLocation = useMutation({
    mutationFn: (id: string) => locationService.deleteLocation(id),
    onSuccess: () => invalidatePalaceLocations(palaceId),
  });

  return { createLocation, updateLocation, deleteLocation };
};
