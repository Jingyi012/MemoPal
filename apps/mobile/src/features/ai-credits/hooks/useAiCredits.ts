import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthProvider';
import { aiCreditsApi } from '../api/aiCredits.api';

export function useAiCredits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-credits', user?.id, 'balance'], queryFn: aiCreditsApi.balance,
    enabled: Boolean(user), staleTime: 0,
  });
}

export function useAiGenerations(enabled = true) {
  const { user } = useAuth();
  const client = useQueryClient();
  return useQuery({
    queryKey: ['ai-credits', user?.id, 'generations'], enabled: Boolean(user) && enabled,
    queryFn: async () => {
      const result = await aiCreditsApi.generations();
      void client.invalidateQueries({ queryKey: ['ai-credits', user?.id, 'balance'] });
      return result;
    },
    staleTime: 0,
    refetchInterval: (query) => query.state.data?.some((x) => ['reserved', 'processing'].includes(x.status)) ? 3000 : false,
  });
}
