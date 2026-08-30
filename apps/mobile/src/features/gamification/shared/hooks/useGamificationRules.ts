import { getGamificationRules, type GamificationRules } from '@/features/gamification/shared/api/gamificationRules';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_RULES: GamificationRules = {
  memoryLearnedXp: 20,
  dueReviewXp: 10,
  extraPracticeXp: 5,
  extraPracticeDailyLimit: 1,
  xpPerLevel: 100,
};

export function useGamificationRules() {
  return useQuery({
    queryKey: ['gamification-rules'],
    queryFn: getGamificationRules,
    staleTime: 1000 * 60 * 10,
    placeholderData: DEFAULT_RULES,
  });
}
