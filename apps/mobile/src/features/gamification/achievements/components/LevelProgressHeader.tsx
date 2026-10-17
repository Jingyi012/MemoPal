import { NightEmphasisCard } from '@/components/NightEmphasisCard';
import { LevelXpProgressBar, getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { typography } from '@/theme/typography';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import type { AvatarDefinition } from '@/features/avatars/types/avatar';
import type { EquippedAppearance } from '@/features/appearance/types/appearance';

interface Props {
  level: {
    currentLevel: number;
    xpInCurrentLevel: number;
    xpToNextLevel: number;
    totalXp: number;
    title: string;
    titleZh?: string;
  };
  streak: number;
  avatar?: AvatarDefinition;
  appearance?: EquippedAppearance;
}

export const LevelProgressHeader: React.FC<Props> = ({ level, streak, avatar, appearance }) => {
  const { language, t } = useTranslation('achievements');
  const { levelWindowXp, isMaxLevel } = getLevelProgressMetrics(level.xpInCurrentLevel, level.xpToNextLevel);
  const localizedTitles: Record<string, string> = {
    'Memory Apprentice': t('memoryApprentice'),
    Novice: t('levelNovice'),
    Apprentice: t('levelApprentice'),
    Scholar: t('levelScholar'),
    Navigator: t('levelNavigator'),
    Strategist: t('levelStrategist'),
    Mnemonist: t('levelMnemonist'),
    Archivist: t('levelArchivist'),
    'Mind Architect': t('levelMindArchitect'),
    'Memory Master': t('levelMemoryMaster'),
    'Palace Sage': t('levelPalaceSage'),
  };
  const localizedTitle = language === 'zh'
    ? level.titleZh ?? localizedTitles[level.title] ?? level.title
    : level.title;

  return (
    <NightEmphasisCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarRing}>
          <MemoryAvatar
            avatar={avatar}
            level={level.currentLevel}
            size={52}
            showLevelBadge={false}
            appearance={appearance}
          />
        </View>
        <View style={styles.levelCopy}>
          <Text style={styles.levelTitle}>{t('level')} {level.currentLevel} · {localizedTitle}</Text>
          <Text style={styles.levelSubtitle}>
            {isMaxLevel
              ? `${t('total')} ${level.totalXp} XP`
              : `${level.xpInCurrentLevel} / ${levelWindowXp} XP ${t('toLevel')} ${level.currentLevel + 1}`}
          </Text>
        </View>
        <View style={styles.streakPill}><Text style={styles.streakText}>🔥 {streak}</Text></View>
      </View>
      <View style={styles.progressTrack}>
        <LevelXpProgressBar
          xpInCurrentLevel={level.xpInCurrentLevel}
          xpToNextLevel={level.xpToNextLevel}
          trackClassName="h-2 overflow-hidden rounded-full bg-white/15"
          fillClassName="h-full rounded-full bg-[#9B8CFF]"
        />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpLabel}>{t('level')} {level.currentLevel}</Text>
        <Text style={styles.xpLabel}>{t('level')} {level.currentLevel + 1}</Text>
      </View>
    </NightEmphasisCard>
  );
};

const styles = {
  card: { marginBottom: 18 },
  topRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, zIndex: 1 as const },
  avatarRing: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)', overflow: 'visible' as const },
  levelCopy: { flex: 1 },
  levelTitle: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 14.5 },
  levelSubtitle: { color: '#C9C5E0', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 1 },
  streakPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  streakText: { color: 'white', fontFamily: typography.displayExtraBold, fontSize: 12 },
  progressTrack: { marginTop: 13, zIndex: 1 as const },
  xpLabels: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 6, zIndex: 1 as const },
  xpLabel: { color: '#C9C5E0', fontFamily: typography.bodyBold, fontSize: 10.5 },
};
