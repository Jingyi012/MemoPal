import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import * as Crypto from 'expo-crypto';
import { useAiCreditConfirmation } from '@/features/ai-credits/hooks/useAiCreditConfirmation';
import { isTerminalCreditError } from '@/features/ai-credits/api/creditErrors';
import {
  numberPegStoryApi,
  type GenerateNumberPegStoriesRequest,
} from '@/features/number-peg/api/numberPegStory.api';

export function useGenerateNumberPegStories() {
  const { confirm } = useAiCreditConfirmation();
  const queryClient = useQueryClient();
  const retry = useRef<{ input: string; id: string; maxCredits: number } | null>(null);
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({
      signal,
      skipConfirmation = false,
      ...request
    }: GenerateNumberPegStoriesRequest & { signal?: AbortSignal; skipConfirmation?: boolean }) => {
      const input = JSON.stringify(request);
      if (retry.current?.input !== input) {
        const approval = await confirm(request.items.length, false, !skipConfirmation);
        if (!approval) throw new Error('AI generation cancelled.');
        retry.current = { input, id: Crypto.randomUUID(), maxCredits: approval.maxCredits };
      }
      if (signal?.aborted) throw new Error('AI generation cancelled.');
      const result = await numberPegStoryApi.generate({ ...request, requestId: retry.current.id, maxCredits: retry.current.maxCredits }, signal);
      retry.current = null;
      return result;
    },
    retry: false,
    onError: (error) => { if (isTerminalCreditError(error)) retry.current = null; },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: ['ai-credits'] }); },
  });
}
