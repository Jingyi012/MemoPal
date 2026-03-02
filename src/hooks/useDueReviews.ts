import * as reviewService from '@/services/review.service';
import { useQuery } from '@tanstack/react-query';

export const DUE_REVIEW_KEYS = {
  all: ['due-reviews'] as const,
};

export function useDueReviews() {
  const query = useQuery({
    queryKey: DUE_REVIEW_KEYS.all,
    queryFn: reviewService.getDueReviews,
    staleTime: 1000 * 60,
  });

  return {
    dueReviews: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
