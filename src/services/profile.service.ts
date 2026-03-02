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
  await userRepo.updateProfileLocal(payload);

  try {
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
  } catch {
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
