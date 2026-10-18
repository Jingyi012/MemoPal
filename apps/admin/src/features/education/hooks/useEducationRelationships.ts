import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educationRelationshipsApi } from '../../../api/educationRelationshipsApi';
import { extractApiErrorMessage } from '../../../lib/errorMessage';
import type { InviteClassroomMemberRequest } from '../../../types/educationRelationships';

export const educationKeys = {
  classrooms: (userId: string) => ['education', userId, 'classrooms'] as const,
  memberships: (userId: string) => ['education', userId, 'memberships'] as const,
  members: (userId: string, classroomId: string) => ['education', userId, 'classrooms', classroomId, 'members'] as const,
  guardianLinks: (userId: string) => ['education', userId, 'guardian-links'] as const,
  guardianVerifications: (userId: string) => ['education', userId, 'guardian-verifications'] as const,
};

export function useEducationRelationships(userId: string, isAdmin = false) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const classrooms = useQuery({ queryKey: educationKeys.classrooms(userId), queryFn: educationRelationshipsApi.listClassrooms, enabled: !!userId });
  const memberships = useQuery({ queryKey: educationKeys.memberships(userId), queryFn: educationRelationshipsApi.listOwnMemberships, enabled: !!userId });
  const guardianLinks = useQuery({ queryKey: educationKeys.guardianLinks(userId), queryFn: educationRelationshipsApi.listGuardianLinks, enabled: !!userId });
  const guardianVerifications = useQuery({ queryKey: educationKeys.guardianVerifications(userId), queryFn: educationRelationshipsApi.listPendingGuardianVerifications, enabled: !!userId && isAdmin });
  const onError = (error: unknown) => message.error(extractApiErrorMessage(error, 'Could not complete the request. Please try again.'));
  const refresh = async (classroomId?: string) => Promise.all([
    client.invalidateQueries({ queryKey: educationKeys.classrooms(userId) }),
    client.invalidateQueries({ queryKey: educationKeys.memberships(userId) }),
    client.invalidateQueries({ queryKey: educationKeys.guardianLinks(userId) }),
    ...(isAdmin ? [client.invalidateQueries({ queryKey: educationKeys.guardianVerifications(userId) })] : []),
    ...(classroomId ? [client.invalidateQueries({ queryKey: educationKeys.members(userId, classroomId) })] : []),
  ]);
  const createClassroom = useMutation({ mutationFn: educationRelationshipsApi.createClassroom, onSuccess: async () => { await refresh(); message.success('Classroom created.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const invite = useMutation({ mutationFn: ({ classroomId, input }: { classroomId: string; input: InviteClassroomMemberRequest }) => educationRelationshipsApi.invite(classroomId, input), onSuccess: async (_data, variables) => { await refresh(variables.classroomId); message.success('Invitation sent.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const revokeMembership = useMutation({ mutationFn: ({ membershipId, classroomId }: { membershipId: string; classroomId: string }) => educationRelationshipsApi.revokeMembership(membershipId).then(() => classroomId), onSuccess: async classroomId => { await refresh(classroomId); message.success('Membership revoked.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const acceptMembership = useMutation({ mutationFn: educationRelationshipsApi.acceptMembership, onSuccess: async () => { await refresh(); message.success('Invitation accepted.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const createGuardianLink = useMutation({ mutationFn: educationRelationshipsApi.createGuardianLink, onSuccess: async () => { await refresh(); message.success('Guardian link created.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const confirmGuardianLink = useMutation({ mutationFn: educationRelationshipsApi.confirmGuardianLink, onSuccess: async () => { await refresh(); message.success('Guardian link confirmed.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const verifyGuardianLink = useMutation({ mutationFn: educationRelationshipsApi.verifyGuardianLink, onSuccess: async () => { await refresh(); message.success('Guardian link verified.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  const revokeGuardianLink = useMutation({ mutationFn: educationRelationshipsApi.revokeGuardianLink, onSuccess: async () => { await refresh(); message.success('Guardian link revoked.'); }, onError, meta: { suppressGlobalErrorToast: true }, retry: false });
  return { classrooms, memberships, guardianLinks, guardianVerifications, createClassroom, invite, revokeMembership, acceptMembership, createGuardianLink, confirmGuardianLink, verifyGuardianLink, revokeGuardianLink };
}

export function useClassroomMembers(userId: string, classroomId: string, canView: boolean) {
  return useQuery({ queryKey: educationKeys.members(userId, classroomId), queryFn: () => educationRelationshipsApi.listMembers(classroomId), enabled: !!userId && !!classroomId && canView });
}
