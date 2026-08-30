import { useAuth } from '@/contexts/AuthProvider';
import { authApi } from '@/features/auth/api/auth';
import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useOnboardingMutations() {
  const queryClient = useQueryClient();
  const { updateAuthenticatedUser } = useAuth();

  const applyUser = async (user: Awaited<ReturnType<typeof authApi.startOnboarding>>) => {
    await updateAuthenticatedUser(user);
    queryClient.setQueryData(CURRENT_USER_KEYS.all, user);
  };

  const start = useMutation({
    mutationFn: ({ categoryId, lessonId }: { categoryId: string; lessonId: string }) =>
      authApi.startOnboarding(categoryId, lessonId),
    retry: false,
    onSuccess: applyUser,
  });
  const complete = useMutation({
    mutationFn: (memorySetId: string) => authApi.completeOnboarding(memorySetId),
    retry: false,
    onSuccess: applyUser,
  });
  const linkMemory = useMutation({
    mutationFn: (memorySetId: string) => authApi.linkOnboardingMemory(memorySetId),
    retry: false,
    onSuccess: applyUser,
  });
  const skip = useMutation({
    mutationFn: () => authApi.skipOnboarding(),
    retry: false,
    onSuccess: applyUser,
  });

  return { start, linkMemory, complete, skip };
}
