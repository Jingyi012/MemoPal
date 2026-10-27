import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationAuthoringApi } from '../../../api/educationAuthoringApi';
import { educationRelationshipsApi } from '../../../api/educationRelationshipsApi';
import { educationAuthoringKeys } from './useEducationAuthoring';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { EducationStudyItemRequest } from '../../../types/educationAuthoring';
import { useEducationText } from '../i18n/useEducationText';

export const studyItemKeys = {
  author: (userId: string, courseId: string, objectiveId: string) => ['education', userId, 'courses', courseId, 'objectives', objectiveId, 'study-items'] as const,
  learner: (userId: string, objectiveId: string) => ['education', userId, 'objectives', objectiveId, 'learner-study-items'] as const,
  classroomCourses: (userId: string, classroomId: string) => ['education', userId, 'classrooms', classroomId, 'courses'] as const,
  courseClassrooms: (userId: string, courseId: string) => ['education', userId, 'courses', courseId, 'classrooms'] as const,
};

export function useEducationStudyItems(userId: string, courseId: string, objectiveId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const { t } = useEducationText();
  const authorKey = studyItemKeys.author(userId, courseId, objectiveId);
  const items = useQuery({ queryKey: authorKey, queryFn: () => educationAuthoringApi.listStudyItems(courseId, objectiveId), enabled: !!userId && !!courseId && !!objectiveId });
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, t('requestError')));
  const refresh = async () => Promise.all([
    client.invalidateQueries({ queryKey: authorKey }),
    client.invalidateQueries({ queryKey: educationAuthoringKeys.objectives(userId, courseId) }),
    client.invalidateQueries({ queryKey: studyItemKeys.learner(userId, objectiveId) }),
  ]);
  const create = useMutation({ mutationFn: (input: EducationStudyItemRequest) => educationAuthoringApi.createStudyItem(courseId, objectiveId, input), onSuccess: async () => { await refresh(); message.success(t('itemSaved')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const update = useMutation({ mutationFn: ({ itemId, input }: { itemId: string; input: EducationStudyItemRequest }) => educationAuthoringApi.updateStudyItem(courseId, objectiveId, itemId, input), onSuccess: async () => { await refresh(); message.success(t('itemSaved')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const remove = useMutation({ mutationFn: (itemId: string) => educationAuthoringApi.deleteStudyItem(courseId, objectiveId, itemId), onSuccess: async () => { await refresh(); message.success(t('deleteSuccess')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const reorder = useMutation({ mutationFn: (itemIds: string[]) => educationAuthoringApi.reorderStudyItems(courseId, objectiveId, itemIds), onSuccess: refresh, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const publish = useMutation({ mutationFn: ({ itemId, confirm }: { itemId: string; confirm: boolean }) => educationAuthoringApi.publishStudyItem(courseId, objectiveId, itemId, confirm), onSuccess: async () => { await refresh(); message.success(t('publishSuccess')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const retract = useMutation({ mutationFn: (itemId: string) => educationAuthoringApi.retractStudyItem(courseId, objectiveId, itemId), onSuccess: async () => { await refresh(); message.success(t('publishSuccess')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const setMetadata = useMutation({ mutationFn: (input: Parameters<typeof educationAuthoringApi.setObjectiveStudyMetadata>[2]) => educationAuthoringApi.setObjectiveStudyMetadata(courseId, objectiveId, input), onSuccess: async () => { await refresh(); message.success(t('settingsSaved')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  return { items, create, update, remove, reorder, publish, retract, setMetadata };
}

export function useLearnerStudyItems(userId: string, objectiveId: string, enabled: boolean) {
  return useQuery({ queryKey: studyItemKeys.learner(userId, objectiveId), queryFn: () => educationAuthoringApi.learnerStudyItems(objectiveId), enabled: !!userId && !!objectiveId && enabled });
}

export function useClassroomCourses(userId: string, classroomId: string, enabled: boolean) {
  const client = useQueryClient(); const { message } = App.useApp(); const { t } = useEducationText();
  const key = studyItemKeys.classroomCourses(userId, classroomId);
  const courses = useQuery({ queryKey: key, queryFn: () => educationRelationshipsApi.listClassroomCourses(classroomId), enabled: !!userId && !!classroomId && enabled });
  const refresh = async () => Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: educationAuthoringKeys.courses(userId) })]);
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, t('requestError')));
  const attach = useMutation({ mutationFn: (courseId: string) => educationRelationshipsApi.attachCourse(classroomId, courseId), onSuccess: async () => { await refresh(); message.success(t('linked')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const detach = useMutation({ mutationFn: (courseId: string) => educationRelationshipsApi.detachCourse(classroomId, courseId), onSuccess: async () => { await refresh(); message.success(t('unlinked')); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const setGuidedPractice = useMutation({
    mutationFn: ({ courseId, enabled }: { courseId: string; enabled: boolean }) => educationRelationshipsApi.setGuidedPractice(classroomId, courseId, enabled, enabled),
    onSuccess: refresh, onError, meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  return { courses, attach, detach, setGuidedPractice };
}

export function useCourseClassrooms(userId: string, courseId: string, enabled: boolean) {
  const client = useQueryClient(); const { message } = App.useApp(); const { t } = useEducationText();
  const key = studyItemKeys.courseClassrooms(userId, courseId);
  const classrooms = useQuery({ queryKey: key, queryFn: () => educationRelationshipsApi.listCourseClassrooms(courseId), enabled: !!userId && !!courseId && enabled });
  const detach = useMutation({ mutationFn: (classroomId: string) => educationRelationshipsApi.detachCourse(classroomId, courseId), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: key }), client.invalidateQueries({ queryKey: ['education', userId, 'classrooms'] })]); message.success(t('unlinked')); }, onError: (error: unknown) => message.error(extractApiErrorMessage(error, t('requestError'))), meta: { suppressGlobalErrorToast: true }, retry: false });
  return { classrooms, detach };
}
