import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { deletePersonalStudyCourse, getPersonalStudyCourse, getPersonalStudyCourses, personalStudyKeys } from '../api/personalStudy.api';
import { educationPracticeApi } from '../api/educationPractice.api';
import { EDUCATION_PRACTICE_KEYS } from './useEducationPracticeItems';

export function useRemoveLearningLibraryItem() {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (item: { id: string; source: 'personal' | 'saved' }) => item.source === 'personal'
      ? deletePersonalStudyCourse(item.id) : educationPracticeApi.setCourseSaved(item.id, false),
    onSuccess: async (_, item) => {
      const userId = user?.id ?? '';
      if (item.source === 'personal') {
        client.removeQueries({ queryKey: personalStudyKeys.course(userId, item.id) });
        await Promise.all([
          client.invalidateQueries({ queryKey: personalStudyKeys.list(userId) }),
          client.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.guidedHomeProgress(userId) }),
          client.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.guidedCourseProgress(userId, item.id) }),
        ]);
      } else await Promise.all([
        client.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.savedCourses(userId) }),
        client.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.publicCourse(userId, item.id) }),
        client.invalidateQueries({ queryKey: ['education', 'public-practice', userId, 'courses'] }),
      ]);
    },
  });
}

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
