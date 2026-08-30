import { getXpIntegrityStatus } from '@/features/profile/services/diagnostics.service';
import { useMutation } from '@tanstack/react-query';

export function useXpIntegrityCheck() {
  return useMutation({
    mutationFn: getXpIntegrityStatus,
  });
}
