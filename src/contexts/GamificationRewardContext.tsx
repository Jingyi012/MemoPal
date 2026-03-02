import GamificationRewardModal from '@/components/GamificationRewardModal';
import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';

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

  const value = useMemo<GamificationRewardContextType>(
    () => ({
      showRewards: (nextPayload) => {
        const hasContent = !!nextPayload.levelUpTo || nextPayload.milestones.length > 0 || nextPayload.badges.length > 0;
        if (!hasContent) return;
        setPayload(nextPayload);
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
