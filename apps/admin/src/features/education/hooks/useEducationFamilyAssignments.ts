import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationAssignmentsApi } from '../../../api/educationAssignmentsApi';
import { educationFamilyApi } from '../../../api/educationFamilyApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { CreateFamilyEducationAssignmentRequest } from '../../../types/educationAssignments';

export const educationFamilyKeys = {
  children: (userId: string) => ['education', userId, 'family', 'children'] as const,
  assignments: (userId: string) => ['education', userId, 'family', 'assignments'] as const,
};

export function useEducationFamilyAssignments(userId: string) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const children = useQuery({ queryKey: educationFamilyKeys.children(userId), queryFn: educationFamilyApi.listVerifiedChildren, enabled: !!userId });
  const assignments = useQuery({ queryKey: educationFamilyKeys.assignments(userId), queryFn: educationAssignmentsApi.listFamily, enabled: !!userId });
  const createAssignment = useMutation({
    mutationFn: (input: CreateFamilyEducationAssignmentRequest) => educationAssignmentsApi.createFamily(input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: educationFamilyKeys.assignments(userId) });
      message.success('Family practice assigned.');
    },
    onError: error => { message.error(extractApiErrorMessage(error, 'Could not create the family assignment.')); },
    meta: { suppressGlobalErrorToast: true }, retry: false,
  });
  return { children, assignments, createAssignment };
}
