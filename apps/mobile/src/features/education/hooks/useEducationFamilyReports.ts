import { useAuth } from '@/contexts/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { educationFamilyReportApi } from '../api/educationFamilyReport.api';

export const EDUCATION_FAMILY_REPORT_KEYS = {
  children: (userId: string | null | undefined) => ['education-family-reports', userId, 'children'] as const,
  report: (userId: string | null | undefined, studentUserId: string | null | undefined) =>
    ['education-family-reports', userId, 'student', studentUserId] as const,
};

export function useEducationFamilyChildren() {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_FAMILY_REPORT_KEYS.children(user?.id),
    queryFn: educationFamilyReportApi.getChildren,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

export function useEducationFamilyReport(studentUserId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: EDUCATION_FAMILY_REPORT_KEYS.report(user?.id, studentUserId),
    queryFn: () => educationFamilyReportApi.getReport(studentUserId!),
    enabled: Boolean(user?.id && studentUserId),
    staleTime: 30_000,
    refetchInterval: studentUserId ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
}
