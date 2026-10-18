import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import type { EducationClassroomMembership, EducationGuardianLink } from '@/features/education/types/educationRelationship.types';

function readMemberships(response: GeneralResponse<EducationClassroomMembership[]>) {
  if (!response.success || !response.data) throw new Error(response.message ?? 'Could not load classroom invitations.');
  return response.data;
}

function readMembership(response: GeneralResponse<EducationClassroomMembership>) {
  if (!response.success || !response.data) throw new Error(response.message ?? 'Could not accept this classroom invitation.');
  return response.data;
}

function readGuardianLinks(response: GeneralResponse<EducationGuardianLink[]>) {
  if (!response.success || !response.data) throw new Error(response.message ?? 'Could not load guardian requests.');
  return response.data;
}

function readGuardianLink(response: GeneralResponse<EducationGuardianLink>) {
  if (!response.success || !response.data) throw new Error(response.message ?? 'Could not confirm this guardian relationship.');
  return response.data;
}

export const educationRelationshipApi = {
  async getMyClassroomMemberships() {
    const response = await api.get<GeneralResponse<EducationClassroomMembership[]>>('/v1/education/memberships');
    return readMemberships(response.data);
  },
  async acceptClassroomInvitation(membershipId: string) {
    const response = await api.post<GeneralResponse<EducationClassroomMembership>>(
      `/v1/education/memberships/${encodeURIComponent(membershipId)}/accept`,
    );
    return readMembership(response.data);
  },
  async declineClassroomInvitation(membershipId: string) {
    const response = await api.delete<GeneralResponse<boolean>>(
      `/v1/education/memberships/${encodeURIComponent(membershipId)}`,
    );
    if (!response.data.success || response.data.data !== true) {
      throw new Error(response.data.message ?? 'Could not decline this classroom invitation.');
    }
  },
  async getMyGuardianLinks() {
    const response = await api.get<GeneralResponse<EducationGuardianLink[]>>('/v1/education/guardian-links');
    return readGuardianLinks(response.data);
  },
  async confirmGuardianLink(linkId: string) {
    const response = await api.post<GeneralResponse<EducationGuardianLink>>(
      `/v1/education/guardian-links/${encodeURIComponent(linkId)}/confirm`,
    );
    return readGuardianLink(response.data);
  },
  async revokeGuardianLink(linkId: string) {
    const response = await api.delete<GeneralResponse<boolean>>(
      `/v1/education/guardian-links/${encodeURIComponent(linkId)}`,
    );
    if (!response.data.success || response.data.data !== true) {
      throw new Error(response.data.message ?? 'Could not decline this guardian request.');
    }
  },
};
