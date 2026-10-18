import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { educationAttemptApi } from '../api/educationAttempt.api';

export const EDUCATION_ATTEMPT_KEYS = {
  all: ['education-attempts'] as const,
  detail: (userId: string | null | undefined, attemptId: string | null | undefined) =>
    [...EDUCATION_ATTEMPT_KEYS.all, userId, attemptId] as const,
};

export function useEducationAssessmentAttempt(attemptId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_ATTEMPT_KEYS.detail(user?.id, attemptId),
    queryFn: () => educationAttemptApi.get(attemptId!),
    enabled: Boolean(user?.id && attemptId),
    staleTime: 0,
    gcTime: 1000 * 60 * 60,
    networkMode: 'online',
    refetchInterval: query => query.state.data?.status === 'submitted' ? 30_000 : false,
    refetchIntervalInBackground: false,
  });
}
