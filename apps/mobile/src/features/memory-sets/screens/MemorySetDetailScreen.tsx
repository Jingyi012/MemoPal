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
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { usePracticeAttemptHistory } from '@/features/practice-attempts';
import type { PracticeAttempt } from '@/features/practice-attempts';
import { Href, useRouter } from 'expo-router';
import { AlertCircle, ArrowRight, Check, Circle, RefreshCcw, X } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { TranslationKey } from '@/core/i18n/i18n';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function MemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('memoryDetails');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const query = useMemorySet(memorySetId);
  const palaceSceneId = query.data?.techniqueKey === 'palace' ? query.data.techniquePlan?.palaceSceneId ?? '' : '';
  const palaceSceneQuery = usePalaceScene(palaceSceneId);
  const historyQuery = usePracticeAttemptHistory(memorySetId);

  if (!isOffline && query.isLoading) return <LoadingView description={t('title')} />;

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
  const reviewDue = isReviewDue(latestAttempt);
  const responseByItemId = new Map(latestAttempt?.responses.map((response) => [response.memoryItemId, response]) ?? []);
  const playerRoute = (isPalace ? `/palaces/memory/${memorySet.id}` : `/number-peg/${memorySet.id}`) as Href;
  const recallRoute = (isPalace ? `/palaces/memory/${memorySet.id}?mode=recall` : `/number-peg/${memorySet.id}?mode=recall`) as Href;
  const retryRoute = (isPalace ? `/palaces/memory/${memorySet.id}?restart=1` : `/number-peg/${memorySet.id}?restart=1`) as Href;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={`${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')} · ${memorySet.items.length} ${memorySet.items.length === 1 ? t('item') : t('items')}`}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SummaryCard memorySet={memorySet} latestAttempt={latestAttempt} palaceScene={palaceSceneQuery.data} t={t} />

        <Text style={[styles.sectionLabel, { color: activeTheme.ink }]}>{t('yourMemoryItems')}</Text>
        <View style={styles.itemList}>
          {memorySet.items.map((item, index) => {
            const response = responseByItemId.get(item.id);
            const status = getItemStatus(response, Boolean(latestAttempt));
            return (
            <View key={item.id} style={[styles.itemRow, index === memorySet.items.length - 1 && styles.itemRowLast]}>
              <View style={[styles.itemNumber, isPalace ? styles.itemNumberPalace : styles.itemNumberPeg]}>
                <Text style={styles.itemNumberText}>{item.position}</Text>
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemPrompt}>{localizeItemPrompt(item.prompt, item.position, t)}</Text>
                <Text style={styles.itemAnswer}>{item.answer}</Text>
              <View style={styles.readyBadge}>
                {status === 'recalled' ? <Check size={13} color={theme.grass} /> : null}
                {status === 'needs-review' ? <X size={13} color={theme.berryDeep} /> : null}
                {status === 'not-tried' ? <AlertCircle size={13} color={theme.inkSoft} /> : null}
                {status === 'ready' ? <Circle size={11} color={theme.inkSoft} /> : null}
                <Text style={[styles.readyText, status === 'needs-review' && styles.needsReviewText, status === 'not-tried' && styles.notTriedText]}>
                  {memorySet.status === 'draft' ? t('statusDraft') : statusLabel(status, t)}
                </Text>
              </View>
              </View>
            </View>
            );
          })}
        </View>

        {memorySet.status === 'draft' ? <AnimatedPressable style={[styles.modeCard, styles.setupCard]} onPress={() => router.push({
          pathname: isPalace ? '/palaces/create-memory' : '/number-peg/create',
          params: { memorySetId: memorySet.id, expectedVersion: String(memorySet.version), title: memorySet.title,
            description: memorySet.description ?? '', memoryFolderId: memorySet.memoryFolderId ?? '', goalType: memorySet.goalType,
            items: JSON.stringify(memorySet.items.slice().sort((a, b) => a.position - b.position).map((item) => item.answer)) },
        } as Href)}>
          <View style={[styles.modeIcon, styles.setupIcon]}><Text style={styles.modeEmoji}>✨</Text></View>
          <View style={styles.modeCopy}>
            <Text style={styles.modeTitle}>{t('draftSetup')}</Text>
            <View style={styles.modeActionRow}><Text style={styles.modeAction}>{t('draftSetup')}</Text><ArrowRight size={14} color={theme.violetDeep} /></View>
          </View>
        </AnimatedPressable> : <>
        <View style={styles.modeSection}>
          <Text style={styles.modeSectionTitle}>{t('chooseMode')}</Text>
          <Text style={styles.modeSectionBody}>{t('chooseModeBody')}</Text>
          <AnimatedPressable onPress={() => router.push(playerRoute)} style={[styles.modeCard, styles.rehearseCard]}>
            <View style={[styles.modeIcon, styles.rehearseIcon]}><Text style={styles.modeEmoji}>👀</Text></View>
            <View style={styles.modeCopy}>
              <Text style={styles.modeTitle}>{t('rehearse')}</Text>
              <Text style={styles.modeBody}>{t('rehearseBody')}</Text>
              <View style={styles.modeActionRow}><Text style={styles.modeAction}>{t('startRehearse')}</Text><ArrowRight size={14} color={theme.violetDeep} /></View>
            </View>
          </AnimatedPressable>
          <AnimatedPressable onPress={() => router.push(recallRoute)} style={[styles.modeCard, styles.recallCard, reviewDue && styles.recallCardDue]}>
            <View style={[styles.modeIcon, styles.recallIcon]}><Text style={styles.modeEmoji}>🧠</Text></View>
            <View style={styles.modeCopy}>
              <View style={styles.modeTitleRow}><Text style={styles.modeTitle}>{t('recallMode')}</Text>{reviewDue ? <Text style={styles.dueBadge}>{t('recommended')}</Text> : null}</View>
              <Text style={styles.modeBody}>{t('recallBody')}</Text>
              <View style={styles.modeActionRow}><Text style={styles.modeAction}>{t('startRecall')}</Text><ArrowRight size={14} color={theme.berryDeep} /></View>
            </View>
          </AnimatedPressable>
        </View>
        <AnimatedPressable onPress={() => router.push(retryRoute)} style={styles.secondaryButton}>
          <RefreshCcw size={16} color={theme.inkSoft} />
          <Text style={styles.secondaryButtonText}>{t('restartPractice')}</Text>
        </AnimatedPressable>
        </>}
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  memorySet,
  latestAttempt,
  palaceScene,
  t,
}: {
  memorySet: MemorySet;
  latestAttempt: PracticeAttempt | null;
  palaceScene?: { imageUrl: string; imageSource?: number };
  t: (key: TranslationKey<'memoryDetails'>) => string;
}) {
  const { styles } = useStyles();
  const isPalace = memorySet.techniqueKey === 'palace';
  const summaryMeta = getSummaryMeta(memorySet, latestAttempt, t);
  const hasPalaceImage = isPalace && !memorySet.emoji && Boolean(palaceScene?.imageUrl || palaceScene?.imageSource);
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, isPalace ? styles.summaryIconPalace : styles.summaryIconPeg]}>
        {memorySet.emoji ? <Text style={styles.techniqueEmoji}>{memorySet.emoji}</Text>
          : hasPalaceImage ? <AppImage imageUrl={palaceScene?.imageUrl} imageSource={palaceScene?.imageSource} style={styles.summaryImage} />
            : <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : getMemorySetPegIcon(memorySet)}</Text>}
      </View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
      <Text style={styles.summaryTitle}>{memorySet.title}</Text>
      <View style={styles.visibilityRow}>
        <Text style={styles.visibilityLabel}>{t('visibility')}</Text>
        <MemoryVisibilityBadge visibility={memorySet.visibility} label={getVisibilityLabel(memorySet.visibility, t)} compact />
      </View>
      <Text style={styles.summaryMeta}>{summaryMeta}</Text>
      <Text style={[styles.reviewSchedule, isReviewDue(latestAttempt) && styles.reviewScheduleDue]}>
        {memorySet.status === 'draft' ? t('draftSetup') : getReviewScheduleLabel(latestAttempt, t)}
      </Text>
      </View>
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

function getSummaryMeta(
  memorySet: MemorySet,
  latestAttempt: PracticeAttempt | null,
  t: (key: TranslationKey<'memoryDetails'>) => string,
) {
  const itemLabel = memorySet.items.length === 1 ? t('item') : t('items');
  if (memorySet.status === 'draft') return `${memorySet.items.length} ${itemLabel} · ${t('statusDraft')}`;
  if (!latestAttempt) return `${memorySet.items.length} ${itemLabel} · ${t('readyToPractice')}`;
  const latestResponseByItem = new Map(
    latestAttempt.responses.map((response) => [response.memoryItemId, response]),
  );
  const recalledCount = Array.from(latestResponseByItem.values()).filter((response) => response.isCorrect).length;
  const retryCount = latestAttempt.responses.filter((response) => response.attemptCount > 1).length;
  if (latestResponseByItem.size < memorySet.items.length) {
    return `${recalledCount}/${memorySet.items.length} ${t('recalled')} · ${t('inProgress')}`;
  }
  if (recalledCount === memorySet.items.length) {
    return retryCount > 0
      ? `${recalledCount}/${memorySet.items.length} ${t('recalled')} · ${retryCount} ${t('retried')}`
      : `${recalledCount}/${memorySet.items.length} ${t('recalled')} · ${t('lastRoundPerfect')}`;
  }
  return `${recalledCount}/${memorySet.items.length} ${t('recalled')} · ${t('keepPracticing')}`;
}

function isReviewDue(latestAttempt: PracticeAttempt | null) {
  return Boolean(latestAttempt?.nextReviewAt && new Date(latestAttempt.nextReviewAt).getTime() <= Date.now());
}

function getReviewScheduleLabel(
  latestAttempt: PracticeAttempt | null,
  t: (key: TranslationKey<'memoryDetails'>) => string,
) {
  if (!latestAttempt?.nextReviewAt) return t('notScheduled');
  if (isReviewDue(latestAttempt)) return t('reviewDue');
  return `${t('nextReview')}: ${new Date(latestAttempt.nextReviewAt).toLocaleString()}`;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 42 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 21, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 15 },
  summaryIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  summaryImage: { width: '100%', height: '100%', borderRadius: 17 },
  techniqueEmoji: { fontSize: 25 },
  summaryIconPalace: { backgroundColor: theme.violetTint },
  summaryIconPeg: { backgroundColor: theme.berryTint },
  summaryCopy: { flex: 1, marginLeft: 13 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 4 },
  visibilityRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  visibilityLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  summaryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, marginTop: 3 },
  reviewSchedule: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 6 },
  reviewScheduleDue: { color: theme.berryDeep },
  modeSection: { marginTop: 24 },
  modeSectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18 },
  modeSectionBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 11 },
  modeCard: { alignItems: 'center', borderRadius: 18, borderWidth: 2, flexDirection: 'row', marginBottom: 10, minHeight: 92, padding: 13 },
  rehearseCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  setupCard: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, marginTop: 24 },
  recallCard: { backgroundColor: theme.sunTint, borderColor: theme.sunLine },
  recallCardDue: { borderColor: theme.berry },
  modeIcon: { alignItems: 'center', borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  rehearseIcon: { backgroundColor: theme.violetLine },
  setupIcon: { backgroundColor: theme.violetLine },
  recallIcon: { backgroundColor: theme.sunLine },
  modeEmoji: { fontSize: 25 },
  modeCopy: { flex: 1, marginLeft: 12 },
  modeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  modeTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dueBadge: { backgroundColor: theme.berryTint, borderRadius: 999, color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, paddingHorizontal: 7, paddingVertical: 3 },
  modeBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  modeActionRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 7 },
  modeAction: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  itemList: { borderRadius: 19, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13 },
  itemRow: { minHeight: 80, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: theme.line },
  itemRowLast: { borderBottomWidth: 0 },
  itemNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemNumberPalace: { backgroundColor: theme.violet },
  itemNumberPeg: { backgroundColor: theme.sun },
  itemNumberText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  itemPrompt: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15, lineHeight: 22, marginTop: 3 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  readyText: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  needsReviewText: { color: theme.berryDeep },
  notTriedText: { color: theme.inkSoft },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  secondaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  secondaryButtonText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
}));
