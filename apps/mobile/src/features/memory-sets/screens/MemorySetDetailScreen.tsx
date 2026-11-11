import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { MemoryVisibilityBadge } from '@/components/MemoryVisibilityBadge';
import { useMemorySet } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { usePalaceScene } from '@/features/palace-scenes';
import { AppImage } from '@/components/AppImage';
import { getMemorySetPegIcon } from '@/features/memory-sets/utils/memorySetIcon';
import { typography } from '@/theme/typography';
import { useMemoryReviewProgress, usePracticeAttemptHistory } from '@/features/practice-attempts';
import { MemoryItemProgress, MemoryReviewProgressCard } from '../components/MemoryReviewProgressCard';
import { MemoryReviewTaskCard } from '../components/MemoryReviewTaskCard';
import { useCallback } from 'react';
import { Href, useRouter, useFocusEffect } from 'expo-router';
import { AlertCircle, ArrowRight, Check, Circle, X } from '@/core/icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { TranslationKey } from '@/core/i18n/i18n';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function MemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t, language } = useTranslation('memoryDetails');
  const { t: planText } = useTranslation('reviewPlan');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const query = useMemorySet(memorySetId);
  const palaceSceneId = query.data?.techniqueKey === 'palace' ? query.data.techniquePlan?.palaceSceneId ?? '' : '';
  const palaceSceneQuery = usePalaceScene(palaceSceneId);
  const historyQuery = usePracticeAttemptHistory(memorySetId);
  const progressQuery = useMemoryReviewProgress(memorySetId);
  const { refetch: refetchProgress } = progressQuery;
  useFocusEffect(useCallback(() => { void refetchProgress(); }, [refetchProgress]));

  if (!isOffline && query.isLoading) return <View style={styles.page}>
    <CommonHeader title={t('title')} backAction={() => router.back()} />
    <LoadingView description={t('title')} />
  </View>;

  if (!query.data) {
    return (
      <View style={styles.page}>
        <CommonHeader eyebrow={t('eyebrow')} title={t('title')} description={canShowRequestErrors ? t('unavailable') : undefined} backAction={() => router.back()} />
        {canShowRequestErrors ? <View style={styles.centerState}>
          <ModuleNoticeCard
            emoji="🧩"
            title={t('loadError')}
            body={t('checkConnection')}
            onAction={() => query.refetch()}
          />
        </View> : null}
      </View>
    );
  }

  const memorySet = query.data;
  const isPalace = memorySet.techniqueKey === 'palace';
  const latestAttempt = historyQuery.data?.[0] ?? null;
  const progressByItem = new Map(progressQuery.data?.items.map((item) => [item.memoryItemId, item]) ?? []);
  const responseByItemId = new Map(latestAttempt?.responses.map((response) => [response.memoryItemId, response]) ?? []);
  const openSession = (scope: 'due' | 'learn' | 'browse') => router.push({
    pathname: '/memory-review/[memorySetId]', params: { memorySetId: memorySet.id, scope },
  });

  return (
    <View style={styles.page}>
      <CommonHeader
        compact
        showAiCredits={false}
        title={t('title')}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SummaryCard memorySet={memorySet} palaceScene={palaceSceneQuery.data} t={t} />
        {memorySet.status !== 'draft' && progressQuery.data ? <MemoryReviewTaskCard progress={progressQuery.data}
          onReview={() => openSession('due')} onLearn={() => openSession('learn')} onBrowse={() => openSession('browse')} /> : null}
        {memorySet.status !== 'draft' ? <MemoryReviewProgressCard progress={progressQuery.data} isPending={progressQuery.isPending}
          isError={progressQuery.isError} onRetry={() => { void progressQuery.refetch(); }} /> : null}

        {memorySet.status === 'draft' ? <AnimatedPressable style={[styles.modeCard, styles.setupCard]} onPress={() => router.push({
          pathname: isPalace ? '/palaces/create-memory' : '/number-peg/create',
          params: { memorySetId: memorySet.id, expectedVersion: String(memorySet.version), title: memorySet.title,
            description: memorySet.description ?? '', memoryFolderId: memorySet.memoryFolderId ?? '', goalType: memorySet.goalType,
            items: JSON.stringify(memorySet.items.slice().sort((a, b) => a.position - b.position).map((item) => item.answer)) },
        } as Href)}>
          <View style={[styles.modeIcon, styles.setupIcon]}><Text style={styles.modeEmoji}>✨</Text></View>
          <View style={styles.modeCopy}>
            <Text style={styles.modeTitle}>{t('draftSetup')}</Text>
          </View><ArrowRight size={20} color={theme.violetDeep} />
        </AnimatedPressable> : !progressQuery.data && memorySet.items.length > 0 ? <View style={styles.modeSection}>
          <AnimatedPressable accessibilityRole="button" onPress={() => openSession('browse')} style={[styles.modeCard, styles.rehearseCard]}>
            <View style={[styles.modeIcon, styles.rehearseIcon]}><Text style={styles.modeEmoji}>👀</Text></View>
            <View style={styles.modeCopy}>
              <Text style={styles.modeTitle}>{planText('browse').replace('{count}', String(memorySet.items.length))}</Text>
              <Text style={styles.modeBody}>{planText('browseNote')}</Text>
            </View>
          </AnimatedPressable>
        </View> : null}
        <View style={styles.listHeading}>
          <Text style={styles.sectionLabel}>{memorySet.status === 'draft' ? (language === 'zh' ? '记忆内容' : 'Memory items') : planText('itemSchedule')}</Text>
          <Text style={styles.summaryMeta}>{memorySet.items.length} {t('items')}</Text>
        </View>
        <View style={styles.itemList}>
          {memorySet.items.map((item, index) => {
            const response = responseByItemId.get(item.id);
            const status = getItemStatus(response, Boolean(latestAttempt));
            const itemProgress = progressByItem.get(item.id);
            const prompt = localizeItemPrompt(item.prompt, item.position, t);
            return (
            <View key={item.id} style={[styles.itemRow, index === memorySet.items.length - 1 && styles.itemRowLast]}>
              <View style={[styles.itemNumber, isPalace ? styles.itemNumberPalace : styles.itemNumberPeg]}>
                <Text style={styles.itemNumberText}>{item.position}</Text>
              </View>
              <View style={styles.itemCopy}>
                {!itemProgress || memorySet.status === 'draft' ? <>
                {prompt.trim() !== item.answer.trim() ? <Text style={styles.itemPrompt}>{prompt}</Text> : null}
                <Text style={styles.itemAnswer}>{item.answer}</Text>
                </> : null}
              {!itemProgress || memorySet.status === 'draft' ? <View style={styles.readyBadge}>
                {status === 'recalled' ? <Check size={13} color={theme.grass} /> : null}
                {status === 'needs-review' ? <X size={13} color={theme.berryDeep} /> : null}
                {status === 'not-tried' ? <AlertCircle size={13} color={theme.inkSoft} /> : null}
                {status === 'ready' ? <Circle size={11} color={theme.inkSoft} /> : null}
                <Text style={[styles.readyText, memorySet.status === 'draft' && styles.draftText, status === 'needs-review' && styles.needsReviewText, status === 'not-tried' && styles.notTriedText]}>
                  {memorySet.status === 'draft' ? t('statusDraft') : statusLabel(status, t)}
                </Text>
              </View> : null}
              {memorySet.status !== 'draft' && itemProgress && progressQuery.data ? <MemoryItemProgress progress={itemProgress}
                title={item.answer} prompt={localizeItemPrompt(item.prompt, item.position, t)}
                stages={progressQuery.data.stageIntervalsDays} /> : null}
              </View>
            </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  memorySet,
  palaceScene,
  t,
}: {
  memorySet: MemorySet;
  palaceScene?: { imageUrl: string; imageSource?: number };
  t: (key: TranslationKey<'memoryDetails'>) => string;
}) {
  const { styles } = useStyles();
  const isPalace = memorySet.techniqueKey === 'palace';
  const hasPalaceImage = isPalace && !memorySet.emoji && Boolean(palaceScene?.imageUrl || palaceScene?.imageSource);
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, isPalace ? styles.summaryIconPalace : styles.summaryIconPeg]}>
          {memorySet.emoji ? <Text style={styles.techniqueEmoji}>{memorySet.emoji}</Text>
            : hasPalaceImage ? <AppImage imageUrl={palaceScene?.imageUrl} imageSource={palaceScene?.imageSource} style={styles.summaryImage} />
              : <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : getMemorySetPegIcon(memorySet)}</Text>}
        </View>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryTitle}>{memorySet.title}</Text>
          <View style={styles.summaryMetadata}>
          <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
            {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
          </Text>
          <MemoryVisibilityBadge visibility={memorySet.visibility} label={getVisibilityLabel(memorySet.visibility, t)} compact />
          </View>
        </View>
      </View>
      {memorySet.description?.trim() ? <Text style={styles.description}>{memorySet.description}</Text> : null}
    </View>
  );
}

type ItemStatus = 'recalled' | 'needs-review' | 'not-tried' | 'ready';

function getItemStatus(response: { isCorrect: boolean } | undefined, hasAttempt: boolean): ItemStatus {
  if (!hasAttempt) return 'ready';
  if (!response) return 'not-tried';
  return response.isCorrect ? 'recalled' : 'needs-review';
}

function statusLabel(status: ItemStatus, t: (key: TranslationKey<'memoryDetails'>) => string) {
  switch (status) {
    case 'recalled': return t('statusRecalled');
    case 'needs-review': return t('statusReview');
    case 'not-tried': return t('statusNotTried');
    default: return t('statusReady');
  }
}

function getVisibilityLabel(visibility: MemorySet['visibility'], t: (key: TranslationKey<'memoryDetails'>) => string) {
  if (visibility === 'public') return t('visibilityPublic');
  if (visibility === 'unlisted') return t('visibilityUnlisted');
  return t('visibilityPrivate');
}

function localizeItemPrompt(
  prompt: string,
  position: number,
  t: (key: TranslationKey<'memoryDetails'>) => string,
) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (normalizedPrompt.startsWith('recall locus')) {
    return `${t('recallLocus')} ${position}`;
  }
  if (normalizedPrompt.startsWith('spell item')) {
    return `${t('spellItem')} ${position}`;
  }
  if (normalizedPrompt.startsWith('recall item')) {
    return `${t('recallItem')} ${position}`;
  }
  return prompt;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: appSpacing.lg, paddingBottom: appSpacing.section, gap: appSpacing.lg },
  summaryCard: { backgroundColor: theme.paper, borderRadius: appRadii.card, borderWidth: 1, borderColor: theme.line, padding: 18, gap: appSpacing.lg, overflow: 'hidden' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: appSpacing.md, marginTop: appSpacing.sm },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.lg, paddingVertical: appSpacing.xs },
  summaryIcon: { width: 60, height: 60, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.paper, overflow: 'hidden' },
  summaryImage: { width: '100%', height: '100%', borderRadius: appRadii.control },
  techniqueEmoji: { fontSize: appArtworkSizes.medium },
  summaryIconPalace: { backgroundColor: theme.violetTint },
  summaryIconPeg: { backgroundColor: theme.berryTint },
  summaryCopy: { flex: 1, minWidth: 0 },
  description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  summaryMetadata: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: appSpacing.sm, marginTop: 5 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.prompt.fontSize, marginTop: appSpacing.xs },
  summaryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, marginTop: 3 },
  modeSection: { gap: appSpacing.sm },
  modeCard: { alignItems: 'center', borderRadius: appRadii.card, borderWidth: 1, flexDirection: 'row', marginBottom: 10, minHeight: 92, padding: 13 },
  rehearseCard: { backgroundColor: theme.paper, borderColor: theme.line },
  setupCard: { backgroundColor: theme.paper, borderColor: theme.line },
  modeIcon: { alignItems: 'center', borderRadius: appRadii.control, height: 52, justifyContent: 'center', width: 52 },
  rehearseIcon: { backgroundColor: theme.violetLine },
  setupIcon: { backgroundColor: theme.violetLine },
  modeEmoji: { fontSize: appArtworkSizes.small },
  modeCopy: { flex: 1, marginLeft: appSpacing.md },
  modeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  modeBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 2 },
  sectionLabel: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  itemList: { borderRadius: 19, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13 },
  itemRow: { minHeight: 80, paddingVertical: appSpacing.md, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: theme.line },
  itemRowLast: { borderBottomWidth: 0 },
  itemNumber: { width: 30, height: 30, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center' },
  itemNumberPalace: { backgroundColor: theme.violet },
  itemNumberPeg: { backgroundColor: theme.sun },
  itemNumberText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  itemCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  itemPrompt: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize, lineHeight: appTextStyles.body.lineHeight, marginTop: 3 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.xs, marginTop: 6 },
  readyText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  draftText: { color: theme.violetDeep },
  needsReviewText: { color: theme.berryDeep },
  notTriedText: { color: theme.inkSoft },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: appSpacing.xxl },
}));
