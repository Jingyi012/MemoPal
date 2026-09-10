import { useMutation } from '@tanstack/react-query';
import {
  numberPegStoryApi,
  type GenerateNumberPegStoriesRequest,
} from '@/features/number-peg/api/numberPegStory.api';

export function useGenerateNumberPegStories() {
  return useMutation({
    networkMode: 'always',
    mutationFn: ({
      signal,
      ...request
    }: GenerateNumberPegStoriesRequest & { signal?: AbortSignal }) =>
      numberPegStoryApi.generate(request, signal),
  });
}
