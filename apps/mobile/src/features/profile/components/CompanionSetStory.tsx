import { Sparkles } from '@/core/icons';
import type { AppearanceDefinition } from '@/features/appearance/types/appearance';
import type { CompanionLook } from '@/features/profile/api/companion.api';
import { isCompanionCompatible } from './CompanionCharacterArtwork';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SET_STORIES: Record<string, { titleEn: string; titleZh: string; lineEn: string; lineZh: string }> = {
  'celestial-scholar': {
    titleEn: 'Celestial Scholar', titleZh: '星穹学者',
    lineEn: 'A quiet constellation, ready for curious questions.',
    lineZh: '把星光收进书页，陪每个好奇的问题出发。',
  },
  'garden-wanderer': {
    titleEn: 'Garden Wanderer', titleZh: '花园漫游者',
    lineEn: 'Every little path becomes an adventure together.',
    lineZh: '沿着花园小径，把每一步都走成小小冒险。',
  },
};

const EQUIPPED_SLOTS: { slot: keyof CompanionLook; type: AppearanceDefinition['itemType'] }[] = [
  { slot: 'headwearId', type: 'headwear' },
  { slot: 'bodywearId', type: 'bodywear' },
  { slot: 'backwearId', type: 'backwear' },
  { slot: 'handItemId', type: 'handItem' },
];

export function CompanionSetStory({ look, items, avatarId }: { look?: CompanionLook | null; items: readonly AppearanceDefinition[]; avatarId?: string | null }) {
  const { language } = useTranslation('profile');
  const { styles, theme } = useStyles();
  const chinese = language === 'zh';
  if (!look) return null;
  const setCounts = new Map<string, number>();
  for (const { slot, type } of EQUIPPED_SLOTS) {
    const item = items.find((candidate) => candidate.id === look[slot]);
    if (!item || !item.isActive || item.itemType !== type || !item.setKey || !isCompanionCompatible(item, avatarId)) continue;
    setCounts.set(item.setKey, (setCounts.get(item.setKey) ?? 0) + 1);
  }
  const storyKey = Object.keys(SET_STORIES).find((key) => (setCounts.get(key) ?? 0) >= 2);
  if (!storyKey) return null;
  const story = SET_STORIES[storyKey];
  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`${chinese ? story.titleZh : story.titleEn}. ${chinese ? story.lineZh : story.lineEn}`}>
      <View style={styles.icon}><Sparkles size={17} color={theme.violetDeep} /></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{chinese ? '套装故事' : 'SET STORY'}</Text>
        <Text style={styles.title}>{chinese ? story.titleZh : story.titleEn}</Text>
        <Text style={styles.line}>{chinese ? story.lineZh : story.lineEn}</Text>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, borderWidth: 1, borderColor: theme.sunLine, backgroundColor: theme.sunTint },
  icon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.paper },
  copy: { flex: 1 }, eyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.8 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13, marginTop: 3 },
  line: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 10, lineHeight: 15, marginTop: 2 },
}));
