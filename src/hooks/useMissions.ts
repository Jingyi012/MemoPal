import { missionApi } from '@/api/mission';
import { useQuery } from '@tanstack/react-query';

export const MISSION_KEYS = {
  all: ['missions'] as const,
  current: () => [...MISSION_KEYS.all, 'current'] as const,
};

export function useMissions() {
  const query = useQuery({
    queryKey: MISSION_KEYS.current(),
    queryFn: () => missionApi.getCurrent(),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });

  return {
    missions: query.data?.missions ?? [],
    generatedAtUtc: query.data?.generatedAtUtc ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
