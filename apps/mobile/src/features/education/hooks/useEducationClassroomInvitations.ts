import { useAuth } from '@/contexts/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationRelationshipApi } from '../api/educationRelationship.api';
import { EDUCATION_ASSIGNMENT_KEYS } from './useMyEducationAssignments';

export const EDUCATION_MEMBERSHIP_KEYS = {
  mine: (userId: string | null | undefined) => ['education-memberships', userId, 'mine'] as const,
  guardianLinks: (userId: string | null | undefined) => ['education-guardian-links', userId] as const,
};

export function useEducationClassroomInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const memberships = useQuery({
    queryKey: EDUCATION_MEMBERSHIP_KEYS.mine(user?.id),
    queryFn: educationRelationshipApi.getMyClassroomMemberships,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const accept = useMutation({
    mutationFn: educationRelationshipApi.acceptClassroomInvitation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EDUCATION_MEMBERSHIP_KEYS.mine(user?.id) }),
        queryClient.invalidateQueries({ queryKey: EDUCATION_ASSIGNMENT_KEYS.mine(user?.id) }),
      ]);
    },
    retry: false,
  });
  const decline = useMutation({
    mutationFn: educationRelationshipApi.declineClassroomInvitation,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EDUCATION_MEMBERSHIP_KEYS.mine(user?.id) }),
        queryClient.invalidateQueries({ queryKey: EDUCATION_ASSIGNMENT_KEYS.mine(user?.id) }),
      ]);
    },
    retry: false,
  });

  return { memberships, accept, decline };
}

export function useEducationGuardianRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const guardianLinks = useQuery({
    queryKey: EDUCATION_MEMBERSHIP_KEYS.guardianLinks(user?.id),
    queryFn: educationRelationshipApi.getMyGuardianLinks,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });
  const confirm = useMutation({
    mutationFn: educationRelationshipApi.confirmGuardianLink,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EDUCATION_MEMBERSHIP_KEYS.guardianLinks(user?.id) }),
        queryClient.invalidateQueries({ queryKey: ['education-family-reports', user?.id] }),
      ]);
    },
    retry: false,
  });
  const decline = useMutation({
    mutationFn: educationRelationshipApi.revokeGuardianLink,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: EDUCATION_MEMBERSHIP_KEYS.guardianLinks(user?.id) }),
        queryClient.invalidateQueries({ queryKey: ['education-family-reports', user?.id] }),
      ]);
    },
    retry: false,
  });
  return { guardianLinks, confirm, decline };
}
