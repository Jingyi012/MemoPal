import { AppImage } from '@/components/AppImage';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemorySet } from '@/features/memory-sets';
import { useMemoryReviewProgress } from '@/features/practice-attempts';
import type { MemoryReviewProgress } from '@/features/practice-attempts';
import type { PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';
import { getPalaceSceneName } from '@/features/palace-scenes/utils/palaceLocalization';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ArrowRight, ChevronRight } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';

export function PalaceJourneyCard({ memorySet, scene, featured = false, actionLabel, onPress }: {
  memorySet: MemorySet;
  scene?: PalaceScene;
  featured?: boolean;
  actionLabel: string;
  onPress: () => void;
}) {
  const { styles, theme } = useStyles();
  const { t, language } = useTranslation('palace');
  const progressQuery = useMemoryReviewProgress(memorySet.id);
  const progress = getJourneyProgress(memorySet, progressQuery.data);
  const sceneName = scene ? getPalaceSceneName(scene, language) : null;
  const showProgress = memorySet.status === 'draft' || Boolean(progressQuery.data);
  return (
    <AnimatedPressable accessibilityRole="button" onPress={onPress} style={[styles.journeyCard, featured && styles.featuredCard]}>
      <View style={[styles.journeyThumbnail, featured && styles.featuredThumbnail]}>
        {scene?.imageUrl ? <AppImage imageUrl={scene.imageUrl} imageSource={scene.imageSource} style={StyleSheet.absoluteFill} /> : <View style={styles.thumbPlaceholder}><Text style={styles.thumbEmoji}>🏠</Text></View>}
      </View>
      <View style={styles.journeyCopy}>
        {featured ? <Text style={styles.continueEyebrow}>{t('continueLastJourney')}</Text> : null}
        <Text numberOfLines={1} style={[styles.journeyTitle, featured && styles.featuredTitle]}>{memorySet.title}</Text>
        <Text numberOfLines={1} style={[styles.journeyMeta, featured && styles.featuredMeta]}>
          {memorySet.items.length} {t('lociPlural')}{sceneName ? ` · ${sceneName}` : ''}
          {memorySet.status === 'draft'
            ? ` · ${t('placedProgress', { placed: progress.completed ?? 0, total: progress.total })}`
            : showProgress
              ? ` · ${t('recalledProgress', { recalled: progress.completed ?? 0, total: progress.total })}`
              : ` · ${t('loadingJourneyProgress')}`}
        </Text>
        {showProgress ? (
          <View style={[styles.progressTrack, featured && styles.featuredTrack]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: progress.total, now: progress.completed ?? 0 }}>
            <View style={[styles.progressFill, { width: `${(progress.ratio ?? 0) * 100}%` }, featured && styles.featuredProgressFill]} />
          </View>
        ) : null}
      </View>
      <View style={[styles.journeyAction, featured && styles.featuredAction]}>
        <Text numberOfLines={1} style={[styles.journeyActionText, featured && styles.featuredActionText]}>{actionLabel}</Text>
        {featured ? <ArrowRight size={15} color={theme.onAccent} /> : <ChevronRight size={16} color={theme.violetDeep} />}
      </View>
    </AnimatedPressable>
  );
}

function getJourneyProgress(memorySet: MemorySet, progress?: MemoryReviewProgress | null) {
  const total = memorySet.items.length;
  if (memorySet.status === 'draft') {
    const completed = Math.min(memorySet.techniquePlan?.palaceBindings.length ?? 0, total);
    return { completed, total, ratio: total ? completed / total : 0 };
  }
  const completed = progress?.items.filter((item) => item.recallSessionsCompleted > 0).length;
  if (completed === undefined) return { completed: null, total, ratio: null };
  return { completed, total, ratio: total ? Math.min(1, completed / total) : 0 };
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  journeyCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 82, padding: 10 },
  featuredCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 22, minHeight: 102, padding: 12 },
  journeyThumbnail: { borderRadius: 14, height: 54, overflow: 'hidden', width: 54 },
  featuredThumbnail: { height: 68, width: 68, borderRadius: 17 },
  thumbPlaceholder: { alignItems: 'center', backgroundColor: theme.violetTint, flex: 1, justifyContent: 'center' },
  thumbEmoji: { fontSize: 25 },
  journeyCopy: { flex: 1, gap: 3, minWidth: 0 },
  continueEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9.5 },
  journeyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  featuredTitle: { color: theme.ink, fontSize: 16 },
  journeyMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14 },
  featuredMeta: { color: theme.inkSoft },
  progressTrack: { backgroundColor: theme.violetTint, borderRadius: 99, height: 5, marginTop: 3, overflow: 'hidden' },
  featuredTrack: { backgroundColor: theme.paper },
  progressFill: { backgroundColor: theme.sky, borderRadius: 99, height: '100%' },
  featuredProgressFill: { backgroundColor: theme.sun },
  journeyAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 13, flexDirection: 'row', gap: 2, justifyContent: 'center', minHeight: 40, paddingHorizontal: 7 },
  journeyActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  featuredAction: { backgroundColor: theme.violetDeep, borderRadius: 14, minHeight: 42, paddingHorizontal: 10 },
  featuredActionText: { color: theme.onAccent, fontSize: 11 },
}));
