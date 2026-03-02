import { authApi } from '@/api/auth';
import { createUserRepository } from '@/repositories/user.repo';
import type { User } from '@/types/users';

const userRepo = createUserRepository();

export async function updateProfile(payload: {
  id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
}): Promise<User> {
  const remote = await authApi.updateProfile({
    displayName: payload.displayName,
    email: payload.email,
    avatarUrl: payload.avatarUrl ?? undefined,
  });

  await userRepo.updateProfileLocal({
    id: payload.id,
    displayName: remote.displayName,
    email: remote.email,
    avatarUrl: remote.avatarUrl ?? null,
  });

  return remote;
}
