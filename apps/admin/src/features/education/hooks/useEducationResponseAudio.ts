import { useQuery } from '@tanstack/react-query';
import { educationAssignmentsApi } from '../../../api/educationAssignmentsApi';

export function useEducationResponseAudio(userId: string, attemptId: string, questionId: string, attachmentId: string) {
  return useQuery({
    queryKey: ['education', userId, 'private-response-audio', attemptId, questionId, attachmentId],
    queryFn: () => educationAssignmentsApi.getAttemptAttachment(attemptId, questionId, attachmentId),
    enabled: Boolean(attemptId && questionId && attachmentId),
    gcTime: 0,
    retry: false,
  });
}
