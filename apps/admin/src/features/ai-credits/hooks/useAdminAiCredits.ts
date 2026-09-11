import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAiCreditsApi } from '../../../api/adminAiCreditsApi';
import type { GrantAiCreditsRequest } from '../../../types/aiCredits';

export function useAdminAiCredits(userId: string, page: number) {
  const client = useQueryClient();
  const balance = useQuery({ queryKey: ['admin-ai-credits', userId, 'balance'],
    queryFn: () => adminAiCreditsApi.balance(userId), enabled: Boolean(userId) });
  const history = useQuery({ queryKey: ['admin-ai-credits', userId, 'history', page],
    queryFn: () => adminAiCreditsApi.history(userId, (page - 1) * 50), enabled: Boolean(userId) });
  const grant = useMutation({ mutationFn: (request: GrantAiCreditsRequest) => adminAiCreditsApi.grant(userId, request),
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-ai-credits', userId] }) });
  return { balance, history, grant };
}
