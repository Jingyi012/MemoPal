import { CURRENT_USER_KEYS } from '@/features/profile/hooks/useCurrentUser';
import { updateProfile } from '@/features/profile/services/profile.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEYS.all });
    },
  });
}
