import { authApi } from '@/api/auth';
import { User } from '@/types/users';

export async function uploadAvatar(fileUri: string): Promise<User> {
  const fileName = fileUri.split('/').pop() || 'avatar.jpg';
  return authApi.uploadAvatar(fileUri, fileName);
}
