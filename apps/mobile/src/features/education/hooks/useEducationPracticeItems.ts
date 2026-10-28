import { useAuth } from '@/contexts/AuthProvider';
import { educationPracticeApi } from '@/features/education/api/educationPractice.api';
import { createEducationGuidedSessionQueryKey } from '@/features/education/utils/educationGuidedLearningFlow';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

export const EDUCATION_PRACTICE_KEYS = {
  items: (userId: string) => ['education', 'practice', userId, 'items'] as const,
  publicCourses: (userId: string, search: string) => ['education', 'public-practice', userId, 'courses', search] as const,
  publicCourse: (userId: string, courseId: string) => ['education', 'public-practice', userId, 'course', courseId] as const,
  publicAssessment: (userId: string, courseId: string, assessmentId: string) => ['education', 'public-practice', userId, courseId, assessmentId] as const,
  publicHistory: (userId: string) => ['education', 'public-practice', userId, 'history'] as const,
  savedCourses: (userId: string) => ['education', 'public-practice', userId, 'saved-courses'] as const,
  guidedCourseProgress: (userId: string, courseId: string, classroomId?: string) => ['education', 'guided-learning', userId, classroomId ? 'classroom' : 'public', classroomId ?? null, 'course', courseId] as const,
  guidedHomeProgress: (userId: string) => ['education', 'guided-learning', userId, 'public', 'home-progress'] as const,
  guidedSession: createEducationGuidedSessionQueryKey,
};

export function useEducationGuidedCourseProgress(courseId: string, classroomId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.guidedCourseProgress(user?.id ?? 'anonymous', courseId, classroomId),
    queryFn: () => educationPracticeApi.getGuidedCourseProgress(courseId, classroomId),
    enabled: Boolean(user?.id && courseId && (classroomId || user.accountMode !== 'RestrictedLearner')),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useEducationGuidedCoursesProgress(courseIds: readonly string[]) {
  const { user } = useAuth();
  return useQueries({ queries: courseIds.map(courseId => ({
    queryKey: EDUCATION_PRACTICE_KEYS.guidedCourseProgress(user?.id ?? 'anonymous', courseId),
    queryFn: () => educationPracticeApi.getGuidedCourseProgress(courseId),
    enabled: Boolean(user?.id && courseId && user.accountMode !== 'RestrictedLearner'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })) });
}

export function useEducationGuidedHomeProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.guidedHomeProgress(user?.id ?? 'anonymous'),
    queryFn: educationPracticeApi.getGuidedHomeProgress,
    enabled: Boolean(user?.id && user.accountMode !== 'RestrictedLearner'),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useStartOrResumeEducationGuidedSession() {
  return useMutation({
    mutationFn: ({ courseId, assessmentId, classroomId }: { courseId: string; assessmentId: string; classroomId?: string }) =>
      educationPracticeApi.startOrResumeGuidedSession(courseId, assessmentId, classroomId),
    retry: false,
  });
}

export function useEducationGuidedSession(sessionId: string, enabled = true, classroomId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.guidedSession(user?.id ?? 'anonymous', sessionId, classroomId),
    queryFn: () => educationPracticeApi.getGuidedSession(sessionId, classroomId),
    enabled: Boolean(user?.id && sessionId && enabled && (classroomId || user.accountMode !== 'RestrictedLearner')),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useEducationClassroomLearningContent(classroomId: string, courseId: string, assessmentId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['education', 'guided-learning', user?.id ?? 'anonymous', 'classroom', classroomId, 'lesson-intro', courseId, assessmentId] as const,
    queryFn: () => educationPracticeApi.getClassroomLearningContent(classroomId, courseId, assessmentId!),
    enabled: Boolean(user?.id && classroomId && courseId && assessmentId),
    retry: false,
    staleTime: 0,
  });
}

export function useEducationPracticeItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.items(user?.id ?? 'anonymous'),
    queryFn: educationPracticeApi.getItems,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

export function useEducationPublicCourses(search: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.publicCourses(user?.id ?? 'anonymous', search),
    queryFn: () => educationPracticeApi.getPublicCourses(search),
    enabled: Boolean(user?.id && user.accountMode !== 'RestrictedLearner'),
    staleTime: 30_000,
  });
}

export function useEducationSavedCourses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.savedCourses(user?.id ?? 'anonymous'),
    queryFn: educationPracticeApi.getSavedCourses,
    enabled: Boolean(user?.id && user.accountMode !== 'RestrictedLearner'),
    staleTime: 30_000,
  });
}

export function useEducationPublicCourseSave(courseId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isSaved: boolean) => educationPracticeApi.setCourseSaved(courseId, isSaved),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.publicCourse(user?.id ?? 'anonymous', courseId) }),
        queryClient.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.savedCourses(user?.id ?? 'anonymous') }),
        queryClient.invalidateQueries({ queryKey: ['education', 'public-practice', user?.id ?? 'anonymous', 'courses'] }),
      ]);
    },
  });
}

export function useReportEducationCourse() {
  return useMutation({
    mutationFn: ({ courseId, reason, details }: { courseId: string; reason: string; details?: string }) =>
      educationPracticeApi.reportCourse(courseId, reason, details),
    retry: false,
  });
}

export function useEducationPublicPracticeHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.publicHistory(user?.id ?? 'anonymous'),
    queryFn: educationPracticeApi.getPublicPracticeHistory,
    enabled: Boolean(user?.id && user.accountMode !== 'RestrictedLearner'),
    staleTime: 30_000,
  });
}

export function useClearEducationPublicPracticeHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: educationPracticeApi.clearPublicPracticeHistory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.publicHistory(user?.id ?? 'anonymous') });
    },
  });
}

export function useEducationPublicCourse(courseId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.publicCourse(user?.id ?? 'anonymous', courseId),
    queryFn: () => educationPracticeApi.getPublicCourse(courseId),
    enabled: Boolean(user?.id && courseId && user.accountMode !== 'RestrictedLearner'),
    staleTime: 30_000,
  });
}

export function useEducationPublicPracticeAssessment(courseId: string, assessmentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_PRACTICE_KEYS.publicAssessment(user?.id ?? 'anonymous', courseId, assessmentId),
    queryFn: () => educationPracticeApi.getPublicPracticeAssessment(courseId, assessmentId),
    enabled: Boolean(user?.id && courseId && assessmentId && user.accountMode !== 'RestrictedLearner'),
    staleTime: 30_000,
  });
}
