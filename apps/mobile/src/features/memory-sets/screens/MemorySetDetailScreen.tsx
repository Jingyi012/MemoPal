import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useMemorySet } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { usePracticeAttemptHistory } from '@/features/practice-attempts';
import type { PracticeAttempt } from '@/features/practice-attempts';
import { Href, useRouter } from 'expo-router';
import { AlertCircle, ArrowRight, Check, Circle, RefreshCcw, X } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { TranslationKey } from '@/core/i18n/i18n';

export default function MemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const router = useRouter();
  const { t } = useTranslation('memoryDetails');
  const query = useMemorySet(memorySetId);
  const historyQuery = usePracticeAttemptHistory(memorySetId);

  if (query.isLoading) return <LoadingView description={t('title')} />;

  if (query.isError || !query.data) {
    return (
      <View style={styles.page}>
        <CommonHeader eyebrow={t('eyebrow')} title={t('title')} description={t('unavailable')} backAction={() => router.back()} />
        <View style={styles.centerState}>
          <ModuleNoticeCard
            emoji="🧩"
            title={t('loadError')}
            body={t('checkConnection')}
            onAction={() => query.refetch()}
          />
        </View>
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
        <SummaryCard memorySet={memorySet} latestAttempt={latestAttempt} t={t} />

        <Text style={styles.sectionLabel}>{t('yourMemoryItems')}</Text>
        <View style={styles.itemList}>
          {memorySet.items.map((item) => {
            const response = responseByItemId.get(item.id);
            const status = getItemStatus(response, Boolean(latestAttempt));
            return (
            <View key={item.id} style={styles.itemRow}>
              <View style={[styles.itemNumber, isPalace ? styles.itemNumberPalace : styles.itemNumberPeg]}>
                <Text style={styles.itemNumberText}>{item.position}</Text>
              </View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemPrompt}>{localizeItemPrompt(item.prompt, item.position, t)}</Text>
                <Text numberOfLines={1} style={styles.itemAnswer}>{item.answer}</Text>
              </View>
              <View style={styles.readyBadge}>
                {status === 'recalled' ? <Check size={13} color={theme.grass} /> : null}
                {status === 'needs-review' ? <X size={13} color={theme.berryDeep} /> : null}
                {status === 'not-tried' ? <AlertCircle size={13} color={theme.inkSoft} /> : null}
                {status === 'ready' ? <Circle size={11} color={theme.inkSoft} /> : null}
                <Text style={[styles.readyText, status === 'needs-review' && styles.needsReviewText, status === 'not-tried' && styles.notTriedText]}>
                  {statusLabel(status, t)}
                </Text>
              </View>
            </View>
            );
          })}
        </View>

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
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  memorySet,
  latestAttempt,
  t,
}: {
  memorySet: MemorySet;
  latestAttempt: PracticeAttempt | null;
  t: (key: TranslationKey<'memoryDetails'>) => string;
}) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const summaryMeta = getSummaryMeta(memorySet, latestAttempt, t);
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, isPalace ? styles.summaryIconPalace : styles.summaryIconPeg]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
      <Text style={styles.summaryTitle}>{memorySet.title}</Text>
      <Text style={styles.summaryMeta}>{summaryMeta}</Text>
      <Text style={[styles.reviewSchedule, isReviewDue(latestAttempt) && styles.reviewScheduleDue]}>
        {getReviewScheduleLabel(latestAttempt, t)}
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 42 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 21, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 15 },
  summaryIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 25 },
  summaryIconPalace: { backgroundColor: '#EEE9FF' },
  summaryIconPeg: { backgroundColor: '#FFF0F4' },
  summaryCopy: { flex: 1, marginLeft: 13 },
  techniqueLabel: { fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  palaceLabel: { color: theme.violetDeep },
  pegLabel: { color: theme.berryDeep },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 4 },
  summaryMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11.5, marginTop: 3 },
  reviewSchedule: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 6 },
  reviewScheduleDue: { color: theme.berryDeep },
  modeSection: { marginTop: 24 },
  modeSectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18 },
  modeSectionBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 11 },
  modeCard: { alignItems: 'center', borderRadius: 18, borderWidth: 2, flexDirection: 'row', marginBottom: 10, minHeight: 92, padding: 13 },
  rehearseCard: { backgroundColor: '#F4F0FF', borderColor: '#DAD0FF' },
  recallCard: { backgroundColor: '#FFF6D9', borderColor: '#FFDF83' },
  recallCardDue: { borderColor: theme.berry },
  modeIcon: { alignItems: 'center', borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  rehearseIcon: { backgroundColor: '#E4DBFF' },
  recallIcon: { backgroundColor: '#FFE9A6' },
  modeEmoji: { fontSize: 25 },
  modeCopy: { flex: 1, marginLeft: 12 },
  modeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  modeTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  dueBadge: { backgroundColor: '#FFE3EA', borderRadius: 999, color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, paddingHorizontal: 7, paddingVertical: 3 },
  modeBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  modeActionRow: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 7 },
  modeAction: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sectionLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  itemList: { borderRadius: 19, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13 },
  itemRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.line },
  itemRowLast: { borderBottomWidth: 0 },
  itemNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  itemNumberPalace: { backgroundColor: theme.violet },
  itemNumberPeg: { backgroundColor: theme.sun },
  itemNumberText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemCopy: { flex: 1, minWidth: 0, marginLeft: 11 },
  itemPrompt: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 2 },
  readyBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8 },
  readyText: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  needsReviewText: { color: theme.berryDeep },
  notTriedText: { color: theme.inkSoft },
  primaryButton: { minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  primaryButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  secondaryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 },
  secondaryButtonText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
