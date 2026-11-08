import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { getPersonalStudyCourse, getPersonalStudyCourses, personalStudyKeys } from '../api/personalStudy.api';

export function usePersonalStudyCourses() {
  const { user } = useAuth();
  return useQuery({ queryKey: personalStudyKeys.list(user?.id ?? ''), queryFn: getPersonalStudyCourses,
    enabled: !!user?.id && user.accountMode !== 'RestrictedLearner', staleTime: 0 });
}
export function usePersonalStudyCourse(id: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({ queryKey: personalStudyKeys.course(user?.id ?? '', id), queryFn: () => getPersonalStudyCourse(id),
    enabled: enabled && !!id && !!user?.id && user.accountMode !== 'RestrictedLearner', staleTime: 0 });
}
