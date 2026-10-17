import AnimatedPressable from '@/components/AnimatedPressable';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryItemReviewProgress, MemoryReviewProgress } from '@/features/practice-attempts';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronDown, ChevronUp } from '@/core/icons';
import { useState } from 'react';
import { getReviewTiming } from '@/features/practice-attempts/utils/reviewSession';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  progress: MemoryReviewProgress | null | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function MemoryReviewProgressCard({ progress, isPending, isError, onRetry }: Props) {
  const { t } = useTranslation('reviewProgress');
  const { styles, theme } = useStyles();
  const [showRules, setShowRules] = useState(false);
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const { t: planText } = useTranslation('reviewPlan');
  return (
    <View style={styles.card}>
      {progress ? <>
        <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded: showRules }}
          accessibilityLabel={`${planText('rounds').replace('{count}', String(progress.recallSessionsCompleted))}, ${planText('progressShort').replace('{count}', String(progress.longTermItemCount)).replace('{total}', String(progress.items.length))}. ${planText('progressDetails')}`}
          onPress={() => setShowRules((value) => !value)} style={styles.rulesToggle}>
          <View style={styles.compactStats}>
            <Text style={styles.body}>{planText('rounds').replace('{count}', String(progress.recallSessionsCompleted))}</Text>
            <Text style={styles.retryText}>{planText('progressShort')
              .replace('{count}', String(progress.longTermItemCount)).replace('{total}', String(progress.items.length))}</Text>
          </View>
          {showRules ? <ChevronUp size={16} color={theme.violetDeep} /> : <ChevronDown size={16} color={theme.violetDeep} />}
        </AnimatedPressable>
        {showRules ? <View style={styles.rules}>
          <Text style={styles.retryText}>{planText('roundBreakdown')
            .replace('{initial}', String(progress.recallSessionsCompleted - progress.reviewSessionsCompleted))
            .replace('{review}', String(progress.reviewSessionsCompleted))}</Text>
          <Text style={styles.heading}>{planText('consolidation')}</Text>
          {progress.items.length > 0 ? <View style={styles.track} accessibilityRole="progressbar"
            accessibilityLabel={t('longTermProgress')}
            accessibilityValue={{ min: 0, max: progress.items.length, now: progress.longTermItemCount }}>
            <View style={[styles.fill, { width: `${progress.longTermItemCount / progress.items.length * 100}%` }]} />
          </View> : <Text style={styles.body}>{t('empty')}</Text>}
          <Text style={styles.body}>{t('countExplanation').replace('{count}', String(progress.recallSessionsCompleted))}</Text>
          <Text style={styles.body}>{planText('remainingRule')}</Text>
          <Text style={styles.body}>{t('remainingExplanation')}</Text>
          <Text style={styles.note}>{t('retentionNote')}</Text>
        </View> : null}
      </> : <Text style={styles.body}>{isOffline ? t('offline')
        : isError ? t('loadError') : isPending ? t('loading') : t('unavailable')}</Text>}
      {isError && canShowRequestErrors ? <>
        {progress ? <Text style={styles.body}>{t('refreshError')}</Text> : null}
        <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </AnimatedPressable>
      </> : null}
    </View>
  );
}

export function MemoryItemProgress({ progress, stages, title, prompt }: {
  progress: MemoryItemReviewProgress; stages: number[]; title: string; prompt: string;
}) {
  const { t } = useTranslation('reviewProgress');
  const { styles, theme } = useStyles();
  const { t: planText, language } = useTranslation('reviewPlan');
  const [expanded, setExpanded] = useState(false);
  const timing = getReviewTiming(progress.dueAt, progress.isDue);
  return (
    <View style={styles.itemProgress}>
      <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded }}
        accessibilityLabel={title + '. ' + planText(timing.key).replace('{count}', String(timing.count)) + '. ' + planText('tapDetails')}
        onPress={() => setExpanded((value) => !value)} style={styles.rulesToggle}>
        <View style={styles.itemHeading}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={[styles.itemStatus, progress.isDue && styles.dueStatus]}>
          {planText(timing.key).replace('{count}', String(timing.count))}
        </Text>
        </View>
        {expanded ? <ChevronUp size={16} color={theme.inkSoft} /> : <ChevronDown size={16} color={theme.inkSoft} />}
      </AnimatedPressable>
      {expanded ? <View style={styles.rules}>
      <Text style={styles.body}>{prompt}</Text>
      <Text style={styles.body}>{t('itemCount').replace('{count}', String(progress.recallSessionsCompleted))}
        {' · '}{t('earnedStages').replace('{count}', String(progress.completedStages)).replace('{total}', String(stages.length))}</Text>
      <View style={styles.stages}>
        {stages.map((days, index) => <View key={days} style={[styles.stage, index < progress.completedStages && styles.earnedStage]}>
          <Text style={styles.stageText}>{index < progress.completedStages ? '✓ ' : ''}{t('days').replace('{days}', String(days))}</Text>
        </View>)}
      </View>
      <Text style={styles.itemStatus}>
        {progress.needsRelearning ? `${t('relearning')} · ` : ''}
        {progress.remainingRecalls === 0 ? t('longTerm')
          : t('itemRemaining').replace('{count}', String(progress.remainingRecalls))}
      </Text>
      <Text style={styles.note}>{planText('stageNote')}</Text>
      {progress.dueAt ? <Text style={styles.body}>{planText('nextReview').replace('{date}',
        new Date(progress.dueAt).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US'))}</Text> : null}
      </View> : null}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 4, gap: 4 },
  compactStats: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, justifyContent: 'space-between' },
  rulesToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rules: { borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10, gap: 8 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
  heading: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: theme.violetTint, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: theme.violet },
  note: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  retry: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 12 },
  retryText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  itemProgress: { marginTop: 2, gap: 4 },
  itemHeading: { flex: 1, minWidth: 0, gap: 3 },
  itemTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 22 },
  dueStatus: { color: theme.berryDeep },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  stage: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.line },
  earnedStage: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  stageText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 11 },
  itemStatus: { flexShrink: 1, color: theme.violetDeep, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18 },
}));
