import { authApi } from '@/features/auth/api/auth';
import { AUTH_STORAGE_KEY } from '@/features/auth/constants/auth';
import type { User } from '@/features/profile/types/users';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(remote));
  return remote;
}
