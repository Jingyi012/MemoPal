import { authApi } from '@/api/auth';

export async function uploadAvatar(fileUri: string): Promise<string> {
  const fileName = fileUri.split('/').pop() || 'avatar.jpg';
  return authApi.uploadAvatar(fileUri, fileName);
}
