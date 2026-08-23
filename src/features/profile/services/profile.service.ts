import { ApiClientError, authApi } from '@/features/auth/api/auth';
import { createUserRepository } from '@/features/profile/repositories/user.repo';
import type { User } from '@/features/profile/types/users';

const userRepo = createUserRepository();

function isLocalAvatarUri(value?: string | null): value is string {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('file://') ||
    normalized.startsWith('content://') ||
    normalized.startsWith('ph://') ||
    normalized.startsWith('assets-library://')
  );
}

export async function updateProfile(payload: {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
}): Promise<User> {
  await userRepo.updateProfileLocal(payload);

  try {
    let resolvedAvatarUrl = payload.avatarUrl ?? undefined;

    // Local device URI must be uploaded first so backend stores a usable URL/path.
    if (isLocalAvatarUri(payload.avatarUrl)) {
      const fileName = payload.avatarUrl.split('/').pop() || 'avatar.jpg';
      const uploadedProfile = await authApi.uploadAvatar(payload.avatarUrl, fileName);
      resolvedAvatarUrl = uploadedProfile.avatarUrl ?? resolvedAvatarUrl;
    }

    const remote = await authApi.updateProfile({
      displayName: payload.displayName,
      email: payload.email,
      avatarUrl: resolvedAvatarUrl,
    });

    await userRepo.updateProfileLocal({
      id: payload.id,
      displayName: remote.displayName,
      email: remote.email,
      avatarUrl: remote.avatarUrl ?? null,
    });

    return remote;
  } catch (error) {
    const apiError = error as ApiClientError | undefined;
    if (apiError?.statusCode && !apiError.isNetworkError) {
      throw error;
    }

    const local = await userRepo.getProfileLocal(payload.id);
    return {
      id: local?.id ?? payload.id,
      displayName: local?.displayName ?? payload.displayName ?? '',
      email: local?.email ?? payload.email ?? '',
      avatarUrl: local?.avatarUrl ?? payload.avatarUrl ?? undefined,
      totalXp: local?.totalXp ?? 0,
      level: local?.level ?? 1,
      isPremium: local?.isPremium ?? false,
    } as User;
  }
}
