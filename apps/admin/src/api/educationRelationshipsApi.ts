import { apiClient } from '../lib/apiClient';
import type { ApiResponse } from '../types/api';
import type {
  ClassroomDto,
  CreateClassroomRequest,
  CreateGuardianLinkRequest,
  EducationMembershipDto,
  GuardianLinkDto,
  InviteClassroomMemberRequest,
} from '../types/educationRelationships';

export const educationRelationshipsApi = {
  async listClassrooms() {
    const response = await apiClient.get<ApiResponse<ClassroomDto[]>>('/v1/education/classrooms');
    return response.data.data;
  },
  async createClassroom(input: CreateClassroomRequest) {
    const response = await apiClient.post<ApiResponse<ClassroomDto>>('/v1/education/classrooms', input);
    return response.data.data;
  },
  async listMembers(classroomId: string) {
    const response = await apiClient.get<ApiResponse<EducationMembershipDto[]>>(`/v1/education/classrooms/${classroomId}/members`);
    return response.data.data;
  },
  async listOwnMemberships() {
    const response = await apiClient.get<ApiResponse<EducationMembershipDto[]>>('/v1/education/memberships');
    return response.data.data;
  },
  async invite(classroomId: string, input: InviteClassroomMemberRequest) {
    const response = await apiClient.post<ApiResponse<EducationMembershipDto>>(`/v1/education/classrooms/${classroomId}/invitations`, input);
    return response.data.data;
  },
  async revokeMembership(membershipId: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/v1/education/memberships/${membershipId}`);
    return response.data.data;
  },
  async acceptMembership(membershipId: string) {
    const response = await apiClient.post<ApiResponse<EducationMembershipDto>>(`/v1/education/memberships/${membershipId}/accept`);
    return response.data.data;
  },
  async listGuardianLinks() {
    const response = await apiClient.get<ApiResponse<GuardianLinkDto[]>>('/v1/education/guardian-links');
    return response.data.data;
  },
  async listPendingGuardianVerifications() {
    const response = await apiClient.get<ApiResponse<GuardianLinkDto[]>>('/v1/education/admin/guardian-links/pending-verification');
    return response.data.data;
  },
  async createGuardianLink(input: CreateGuardianLinkRequest) {
    const response = await apiClient.post<ApiResponse<GuardianLinkDto>>('/v1/education/guardian-links', input);
    return response.data.data;
  },
  async confirmGuardianLink(linkId: string) {
    const response = await apiClient.post<ApiResponse<GuardianLinkDto>>(`/v1/education/guardian-links/${linkId}/confirm`);
    return response.data.data;
  },
  async verifyGuardianLink(linkId: string) {
    const response = await apiClient.post<ApiResponse<GuardianLinkDto>>(`/v1/education/guardian-links/${linkId}/verify`);
    return response.data.data;
  },
  async revokeGuardianLink(linkId: string) {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/v1/education/guardian-links/${linkId}`);
    return response.data.data;
  },
};
