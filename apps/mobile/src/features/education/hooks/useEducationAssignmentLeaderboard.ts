import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { educationLeaderboardApi } from '../api/educationLeaderboard.api';

export function useEducationAssignmentLeaderboard(assignmentId: string, resultsPublishedAt: string | null, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['education-assignment-leaderboard', user?.id, assignmentId, resultsPublishedAt],
    queryFn: () => educationLeaderboardApi.getMyAssignmentRank(assignmentId),
    enabled: Boolean(user?.id && assignmentId && enabled),
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}
