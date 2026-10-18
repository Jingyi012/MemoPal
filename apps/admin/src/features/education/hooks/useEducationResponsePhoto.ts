import { useQuery } from '@tanstack/react-query';
import { educationAssignmentsApi } from '../../../api/educationAssignmentsApi';

export function useEducationResponsePhoto(userId: string, attemptId: string, questionId: string, attachmentId: string) {
  return useQuery({
    queryKey: ['education', userId, 'private-response-photo', attemptId, questionId, attachmentId],
    queryFn: () => educationAssignmentsApi.getAttemptPhoto(attemptId, questionId, attachmentId),
    enabled: Boolean(attemptId && questionId && attachmentId),
    gcTime: 0,
    retry: false,
  });
}
