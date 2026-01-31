import { useLocationRepository } from '@/repositories/location.repo';
import { useQuery } from '@tanstack/react-query';

export const useLocation = (locationId: string) => {
  const locationRepo = useLocationRepository();

  const {
    data: location,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['location', locationId],
    queryFn: async () => {
      if (!locationId) return null;
      return await locationRepo.getById(locationId);
    },
    enabled: !!locationId,
  });

  return {
    location,
    isLoading,
    isError,
    error,
  };
};

export const useLocationsByPalace = (palaceId: string) => {
  const locationRepo = useLocationRepository();

  const {
    data: locations,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['locations', 'palace', palaceId],
    queryFn: async () => {
      if (!palaceId) return [];
      return await locationRepo.getByPalace(palaceId);
    },
    enabled: !!palaceId,
  });

  return {
    locations,
    isLoading,
    isError,
    error,
  };
};
