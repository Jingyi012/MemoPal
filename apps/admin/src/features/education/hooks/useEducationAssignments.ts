import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationAssignmentsApi } from '../../../api/educationAssignmentsApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { CreateEducationAssignmentRequest, CreateEducationRetakeRequest } from '../../../types/educationAssignments';

export const educationAssignmentKeys = {
  classroom: (userId: string, classroomId: string) => ['education', userId, 'classrooms', classroomId, 'assignments'] as const,
};

export function useEducationAssignments(userId: string, classroomId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const key = educationAssignmentKeys.classroom(userId, classroomId);
  const assignments = useQuery({ queryKey: key, queryFn: () => educationAssignmentsApi.listClassroom(classroomId), enabled: !!userId && !!classroomId });
  const createAssignment = useMutation({
    mutationFn: (input: CreateEducationAssignmentRequest) => educationAssignmentsApi.createClassroom(classroomId, input),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: key }); message.success('Assignment created.'); },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not create the assignment.')),
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  return { assignments, createAssignment };
}

export function useEducationAssignmentGradebook(userId: string, assignmentId: string, enabled: boolean) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const key = ['education', userId, 'assignments', assignmentId, 'gradebook'] as const;
  const gradebook = useQuery({ queryKey: key, queryFn: () => educationAssignmentsApi.getGradebook(assignmentId), enabled: Boolean(userId && assignmentId && enabled) });
  const createRetake = useMutation({
    mutationFn: (input: CreateEducationRetakeRequest) => educationAssignmentsApi.createRetake(assignmentId, input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['education', userId, 'classrooms'] }),
      ]);
      message.success('Retake assigned. The original result remains unchanged.');
    },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not authorize the retake.')),
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  const publishResults = useMutation({
    mutationFn: () => educationAssignmentsApi.publishResults(assignmentId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['education', userId, 'classrooms'] }),
      ]);
      message.success('Results published to students.');
    },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not publish results.')),
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  const correctGrade = useMutation({
    mutationFn: (input: { attemptId: string; score: number; reason: string }) =>
      educationAssignmentsApi.correctGrade(assignmentId, input.attemptId, { score: input.score, reason: input.reason }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['education', userId, 'classrooms'] }),
      ]);
      message.success('Grade corrected. Results are hidden until you publish them again.');
    },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not correct the grade.')),
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  const gradeWrittenResponse = useMutation({
    mutationFn: (input: { attemptId: string; questionId: string; score: number; feedback: string }) =>
      educationAssignmentsApi.gradeWrittenResponse(assignmentId, input.attemptId, input.questionId, { score: input.score, feedback: input.feedback }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: ['education', userId, 'classrooms'] }),
      ]);
      message.success('Written response graded.');
    },
    onError: error => message.error(extractApiErrorMessage(error, 'Could not grade the response.')),
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  return { gradebook, publishResults, correctGrade, gradeWrittenResponse, createRetake };
}
