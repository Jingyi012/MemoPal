import { useQuery } from '@tanstack/react-query';
import { educationProgressApi } from '../../../api/educationProgressApi';

export function useClassroomObjectiveProgress(userId: string, classroomId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['education', userId, 'classrooms', classroomId, 'objective-progress'],
    queryFn: () => educationProgressApi.getClassroomObjectiveProgress(classroomId),
    enabled: Boolean(userId && classroomId && enabled),
  });
}
