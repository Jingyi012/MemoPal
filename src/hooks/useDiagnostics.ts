import { getXpIntegrityStatus } from '@/services/diagnostics.service';
import { useMutation } from '@tanstack/react-query';

export function useXpIntegrityCheck() {
  return useMutation({
    mutationFn: getXpIntegrityStatus,
  });
}
