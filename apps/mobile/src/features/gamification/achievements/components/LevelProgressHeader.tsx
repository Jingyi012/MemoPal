import { HighlightCard } from '@/components/HighlightCard';
import { LevelXpProgressBar, getLevelProgressMetrics } from '@/components/LevelXpProgressBar';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
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
  cardStyle?: StyleProp<ViewStyle>;
}

export const LevelProgressHeader: React.FC<Props> = ({ level, streak, avatar, appearance, cardStyle }) => {
  const { styles } = useStyles();
  const { language, t } = useTranslation('achievements');
  const { isMaxLevel } = getLevelProgressMetrics(level.xpInCurrentLevel, level.xpToNextLevel);
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
    <HighlightCard style={[styles.card, cardStyle]}>
      <View style={styles.topRow}>
        <View style={styles.avatarRing}>
          <MemoryAvatar
            avatar={avatar}
            level={level.currentLevel}
            size={60}
            showLevelBadge={false}
            appearance={appearance}
          />
        </View>
        <View style={styles.levelCopy}>
          <Text style={styles.levelTitle}>{t('level')} {level.currentLevel} · {localizedTitle}</Text>
          <Text style={styles.levelSubtitle}>
            {isMaxLevel
              ? `${t('total')} ${level.totalXp} XP`
              : t('xpToNextLevel', {
                  xp: Math.max(0, level.xpToNextLevel),
                  level: level.currentLevel + 1,
                })}
          </Text>
        </View>
        <View style={styles.streakPill}><Text style={styles.streakText}>🔥 {streak}</Text></View>
      </View>
      <View style={styles.progressTrack}>
        <LevelXpProgressBar
          xpInCurrentLevel={level.xpInCurrentLevel}
          xpToNextLevel={level.xpToNextLevel}
          trackClassName="h-2 overflow-hidden rounded-full bg-[#F3F0FF] dark:bg-[#37304F]"
          fillClassName="h-full rounded-full"
        />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpLabel}>{t('level')} {level.currentLevel}</Text>
        <Text style={styles.xpLabel}>{t('level')} {level.currentLevel + 1}</Text>
      </View>
    </HighlightCard>
  );
};

const useStyles = createThemedStyles((theme) => ({
  card: { marginBottom: 18 },
  topRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  avatarRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: theme.violetLine, overflow: 'visible' as const },
  levelCopy: { flex: 1, minWidth: 0 },
  levelTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15 },
  levelSubtitle: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, marginTop: 2 },
  streakPill: { backgroundColor: theme.sunTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  streakText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 12 },
  progressTrack: { marginTop: 13 },
  xpLabels: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 6 },
  xpLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5 },
}));
