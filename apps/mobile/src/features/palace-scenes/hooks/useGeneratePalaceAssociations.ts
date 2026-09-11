import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { useAiCreditConfirmation } from '@/features/ai-credits/hooks/useAiCreditConfirmation';
import { isTerminalCreditError } from '@/features/ai-credits/api/creditErrors';
import {
  palaceAssociationApi,
  type GeneratePalaceAssociationsRequest,
} from '../api/palaceAssociation.api';

export function useGeneratePalaceAssociations() {
  const { confirm } = useAiCreditConfirmation();
  const queryClient = useQueryClient();
  const retry = useRef<{ input: string; id: string; maxCredits: number } | null>(null);
  return useMutation({
    mutationFn: async (request: GeneratePalaceAssociationsRequest) => {
      const input = JSON.stringify(request);
      if (retry.current?.input !== input) {
        const approval = await confirm(request.items.length);
        if (!approval) throw new Error('AI generation cancelled.');
        retry.current = { input, id: Crypto.randomUUID(), maxCredits: approval.maxCredits };
      }
      const result = await palaceAssociationApi.generate({ ...request, requestId: retry.current.id, maxCredits: retry.current.maxCredits });
      retry.current = null;
      return result;
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: ['ai-credits'] }); },
    retry: false,
    onError: (error) => { if (isTerminalCreditError(error)) retry.current = null; },
  });
}
