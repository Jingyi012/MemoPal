import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { educationAssignmentApi } from '../api/educationAssignment.api';

export const EDUCATION_ASSIGNMENT_KEYS = {
  all: ['education-assignments'] as const,
  mine: (userId: string | null | undefined) =>
    [...EDUCATION_ASSIGNMENT_KEYS.all, 'mine', userId] as const,
};

export function useMyEducationAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_ASSIGNMENT_KEYS.mine(user?.id),
    queryFn: educationAssignmentApi.getMyAssignments,
    enabled: Boolean(user?.id),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 10,
    networkMode: 'online',
  });
}
