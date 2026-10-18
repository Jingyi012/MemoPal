import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationAuthoringApi } from '../../../api/educationAuthoringApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { EducationQuestionRequest } from '../../../types/educationAuthoring';

export const educationAuthoringKeys = {
  courses: (userId: string) => ['education', userId, 'courses'] as const,
  objectives: (userId: string, courseId: string) => ['education', userId, 'courses', courseId, 'objectives'] as const,
  assessments: (userId: string, courseId: string) => ['education', userId, 'courses', courseId, 'assessments'] as const,
  assessment: (userId: string, id: string) => ['education', userId, 'assessments', id] as const,
};

export function useEducationCourses(userId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const courses = useQuery({ queryKey: educationAuthoringKeys.courses(userId), queryFn: educationAuthoringApi.listCourses, enabled: !!userId });
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, 'Could not complete the request. Please try again.'));
  const createCourse = useMutation({ mutationFn: educationAuthoringApi.createCourse, onSuccess: async () => { await client.invalidateQueries({ queryKey: educationAuthoringKeys.courses(userId) }); message.success('Course created.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const setCourseVisibility = useMutation({
    mutationFn: (input: { courseId: string; isPublic: boolean }) => educationAuthoringApi.setCourseVisibility(input.courseId, input.isPublic),
    onSuccess: async (_course, input) => {
      await client.invalidateQueries({ queryKey: educationAuthoringKeys.courses(userId) });
      message.success(input.isPublic ? 'Course is now available for public practice.' : 'Course is no longer public.');
    },
    onError,
    meta: { suppressGlobalErrorToast: true },
    retry: false,
  });
  return { courses, createCourse, setCourseVisibility };
}

export function useEducationCourse(userId: string, courseId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const objectives = useQuery({ queryKey: educationAuthoringKeys.objectives(userId, courseId), queryFn: () => educationAuthoringApi.listObjectives(courseId), enabled: !!userId && !!courseId });
  const memorySets = useQuery({ queryKey: ['community-memory-sets', 'education-recommendations', userId], queryFn: educationAuthoringApi.listRecommendableMemorySets, enabled: !!userId && !!courseId });
  const assessments = useQuery({ queryKey: educationAuthoringKeys.assessments(userId, courseId), queryFn: () => educationAuthoringApi.listAssessments(courseId), enabled: !!userId && !!courseId });
  const refresh = async () => Promise.all([
    client.invalidateQueries({ queryKey: educationAuthoringKeys.objectives(userId, courseId) }),
    client.invalidateQueries({ queryKey: educationAuthoringKeys.assessments(userId, courseId) }),
  ]);
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, 'Could not complete the request. Please try again.'));
  const createObjective = useMutation({ mutationFn: (input: { title: string; recommendedMemorySetId?: string }) => educationAuthoringApi.createObjective(courseId, input.title, input.recommendedMemorySetId), onSuccess: async () => { await refresh(); message.success('Learning objective created.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const setMemoryRecommendation = useMutation({
    mutationFn: (input: { objectiveId: string; recommendedMemorySetId: string | null }) =>
      educationAuthoringApi.setObjectiveMemoryRecommendation(courseId, input.objectiveId, input.recommendedMemorySetId),
    onSuccess: async () => { await refresh(); message.success('Memory recommendation updated.'); },
    onError, meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  const createAssessment = useMutation({ mutationFn: (title: string) => educationAuthoringApi.createAssessment(courseId, title), onSuccess: async () => { await refresh(); message.success('Assessment created.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  return { objectives, assessments, memorySets, createObjective, setMemoryRecommendation, createAssessment };
}

export function useEducationAssessment(userId: string, assessmentId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const queryKey = educationAuthoringKeys.assessment(userId, assessmentId);
  const assessment = useQuery({ queryKey, queryFn: () => educationAuthoringApi.getAssessment(assessmentId), enabled: !!userId && !!assessmentId });
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, 'Could not complete the request. Please try again.'));
  const update = useMutation({ mutationFn: (input: { expectedVersion: number; title: string; questions: EducationQuestionRequest[] }) => educationAuthoringApi.updateAssessment({ id: assessmentId, ...input }), onSuccess: async () => { await client.invalidateQueries({ queryKey }); message.success('Draft saved.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const publish = useMutation({ mutationFn: (input: { version: number; isPublicPractice: boolean }) => educationAuthoringApi.publishAssessment(assessmentId, input.version, input.isPublicPractice), onSuccess: async () => { await client.invalidateQueries({ queryKey }); message.success('Assessment published.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  return { assessment, update, publish };
}
