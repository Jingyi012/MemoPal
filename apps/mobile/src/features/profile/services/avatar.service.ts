import { authApi } from '@/features/auth/api/auth';
import { User } from '@/features/profile/types/users';

export async function uploadAvatar(fileUri: string): Promise<User> {
  const fileName = fileUri.split('/').pop() || 'avatar.jpg';
  return authApi.uploadAvatar(fileUri, fileName);
}
