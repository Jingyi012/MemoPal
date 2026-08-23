import * as reviewService from '@/features/palace/shared/services/review.service';
import { useQuery } from '@tanstack/react-query';

export const DUE_REVIEW_KEYS = {
  all: ['due-reviews'] as const,
};

export function useDueReviews(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: DUE_REVIEW_KEYS.all,
    enabled: options?.enabled ?? true,
    queryFn: () => reviewService.getDueReviewSnapshot(2),
    staleTime: 1000 * 60,
  });

  return {
    dueReviews: query.data?.dueReviews ?? [],
    dueLessons: query.data?.dueLessons ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
