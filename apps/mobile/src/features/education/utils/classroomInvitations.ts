type ClassroomInvitationLike = Readonly<{ status: string; expiresAt: string }>;

export function getPendingEducationInvitations<T extends ClassroomInvitationLike>(
  memberships: readonly T[],
  now = Date.now(),
): T[] {
  return memberships.filter((membership) => {
    const expiresAt = Date.parse(membership.expiresAt);
    return membership.status === 'pending' && Number.isFinite(expiresAt) && expiresAt > now;
  });
}
