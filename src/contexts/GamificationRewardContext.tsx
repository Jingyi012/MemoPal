import GamificationRewardModal from '@/components/GamificationRewardModal';
import React, { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';

type RewardPayload = { levelUpTo?: number; milestones: string[]; badges: string[] };

type GamificationRewardContextType = {
  showRewards: (payload: RewardPayload) => void;
};

const GamificationRewardContext = createContext<GamificationRewardContextType | undefined>(
  undefined
);

export function GamificationRewardProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<RewardPayload>({ milestones: [], badges: [] });
  const shownRewardKeys = useRef<Set<string>>(new Set());

  const value = useMemo<GamificationRewardContextType>(
    () => ({
      showRewards: (nextPayload) => {
        const newMilestones = nextPayload.milestones.filter((title) => {
          const key = `milestone:${title}`;
          if (shownRewardKeys.current.has(key)) return false;
          shownRewardKeys.current.add(key);
          return true;
        });

        const newBadges = nextPayload.badges.filter((name) => {
          const key = `badge:${name}`;
          if (shownRewardKeys.current.has(key)) return false;
          shownRewardKeys.current.add(key);
          return true;
        });

        const levelRewardKey = nextPayload.levelUpTo ? `level:${nextPayload.levelUpTo}` : null;
        const shouldShowLevel = Boolean(
          levelRewardKey && !shownRewardKeys.current.has(levelRewardKey)
        );
        if (levelRewardKey && shouldShowLevel) {
          shownRewardKeys.current.add(levelRewardKey);
        }

        const normalizedPayload: RewardPayload = {
          levelUpTo: shouldShowLevel ? nextPayload.levelUpTo : undefined,
          milestones: newMilestones,
          badges: newBadges,
        };
        const hasContent =
          !!normalizedPayload.levelUpTo ||
          normalizedPayload.milestones.length > 0 ||
          normalizedPayload.badges.length > 0;
        if (!hasContent) return;
        setPayload(normalizedPayload);
        setVisible(true);
      },
    }),
    []
  );

  return (
    <GamificationRewardContext.Provider value={value}>
      {children}
      <GamificationRewardModal
        visible={visible}
        levelUpTo={payload.levelUpTo}
        milestones={payload.milestones}
        badges={payload.badges}
        onClose={() => setVisible(false)}
      />
    </GamificationRewardContext.Provider>
  );
}

export function useGamificationRewards() {
  const context = useContext(GamificationRewardContext);
  if (!context) throw new Error('useGamificationRewards must be used within GamificationRewardProvider');
  return context;
}
