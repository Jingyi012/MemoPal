import { missionApi } from '@/api/mission';
import { GamificationMobileUiConfig } from '@/types/missions';
import { useQuery } from '@tanstack/react-query';

export const DEFAULT_GAMIFICATION_UI_CONFIG: GamificationMobileUiConfig = {
  homeMissionCardTitle: 'Mission Board',
  homeMissionCardDescription: 'Track your current missions and claim rewards.',
  missionScreenTitle: 'Mission Board',
  missionScreenDescription: 'Complete missions to earn XP and stay consistent.',
  missionSectionTitle: 'Active Missions',
  missionSectionDescription: 'Complete each mission and claim your XP reward.',
  badgeSectionTitle: 'Badges',
  milestoneSectionTitle: 'Milestone Journey',
  homeMissionPreviewCount: 2,
  milestoneTypeLabels: {
    reviews_completed: 'Review Milestones',
    lessons_completed: 'Lesson Milestones',
    words_learned: 'Word Milestones',
    xp_earned: 'XP Milestones',
    streak_days: 'Streak Milestones',
    mastered_lessons: 'Mastery Milestones',
    level: 'Level Milestones',
    total_xp: 'XP Milestones',
  },
};

export const GAMIFICATION_UI_KEYS = {
  all: ['gamification-ui'] as const,
  mobile: () => [...GAMIFICATION_UI_KEYS.all, 'mobile'] as const,
};

function normalizeConfig(raw?: Partial<GamificationMobileUiConfig> | null): GamificationMobileUiConfig {
  if (!raw) {
    return DEFAULT_GAMIFICATION_UI_CONFIG;
  }

  return {
    homeMissionCardTitle: raw.homeMissionCardTitle?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.homeMissionCardTitle,
    homeMissionCardDescription:
      raw.homeMissionCardDescription?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.homeMissionCardDescription,
    missionScreenTitle: raw.missionScreenTitle?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.missionScreenTitle,
    missionScreenDescription:
      raw.missionScreenDescription?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.missionScreenDescription,
    missionSectionTitle: raw.missionSectionTitle?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.missionSectionTitle,
    missionSectionDescription:
      raw.missionSectionDescription?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.missionSectionDescription,
    badgeSectionTitle: raw.badgeSectionTitle?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.badgeSectionTitle,
    milestoneSectionTitle:
      raw.milestoneSectionTitle?.trim() || DEFAULT_GAMIFICATION_UI_CONFIG.milestoneSectionTitle,
    homeMissionPreviewCount: Math.min(
      6,
      Math.max(
        0,
        Number.isFinite(raw.homeMissionPreviewCount)
          ? Number(raw.homeMissionPreviewCount)
          : DEFAULT_GAMIFICATION_UI_CONFIG.homeMissionPreviewCount
      )
    ),
    milestoneTypeLabels: {
      ...DEFAULT_GAMIFICATION_UI_CONFIG.milestoneTypeLabels,
      ...(raw.milestoneTypeLabels ?? {}),
    },
  };
}

export function useGamificationUiConfig() {
  const query = useQuery({
    queryKey: GAMIFICATION_UI_KEYS.mobile(),
    queryFn: async () => {
      try {
        return normalizeConfig(await missionApi.getMobileUiConfig());
      } catch {
        return DEFAULT_GAMIFICATION_UI_CONFIG;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  return {
    config: query.data ?? DEFAULT_GAMIFICATION_UI_CONFIG,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
