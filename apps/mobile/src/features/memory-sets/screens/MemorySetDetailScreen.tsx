import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useMemorySet } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { usePracticeAttemptHistory } from '@/features/practice-attempts';
import type { PracticeAttempt } from '@/features/practice-attempts';
import { Href, useRouter } from 'expo-router';
import { AlertCircle, ArrowRight, Check, Circle, RefreshCcw, X } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';

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
            body="Check your connection and try again."
            onAction={() => query.refetch()}
          />
        </View>
      </View>
    );
  }

  const memorySet = query.data;
  const isPalace = memorySet.techniqueKey === 'palace';
  const latestAttempt = historyQuery.data?.[0] ?? null;
  const responseByItemId = new Map(latestAttempt?.responses.map((response) => [response.memoryItemId, response]) ?? []);
  const playerRoute = (isPalace ? `/palaces/memory/${memorySet.id}` : `/number-peg/${memorySet.id}`) as Href;
  const retryRoute = (isPalace ? `/palaces/memory/${memorySet.id}?restart=1` : `/number-peg/${memorySet.id}?restart=1`) as Href;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={`${isPalace ? 'Memory Palace' : 'Number Peg'} · ${memorySet.items.length} items`}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SummaryCard memorySet={memorySet} latestAttempt={latestAttempt} />

        <Text style={styles.sectionLabel}>Your memory items</Text>
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
                <Text style={styles.itemPrompt}>{item.prompt}</Text>
                <Text numberOfLines={1} style={styles.itemAnswer}>{item.answer}</Text>
              </View>
              <View style={styles.readyBadge}>
                {status === 'recalled' ? <Check size={13} color={theme.grass} /> : null}
                {status === 'needs-review' ? <X size={13} color={theme.berryDeep} /> : null}
                {status === 'not-tried' ? <AlertCircle size={13} color={theme.inkSoft} /> : null}
                {status === 'ready' ? <Circle size={11} color={theme.inkSoft} /> : null}
                <Text style={[styles.readyText, status === 'needs-review' && styles.needsReviewText, status === 'not-tried' && styles.notTriedText]}>
                  {statusLabel(status)}
                </Text>
              </View>
            </View>
            );
          })}
        </View>

        <AnimatedPressable onPress={() => router.push(playerRoute)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Resume session</Text>
          <ArrowRight size={18} color={theme.ink} />
        </AnimatedPressable>
        <AnimatedPressable onPress={() => router.push(retryRoute)} style={styles.secondaryButton}>
          <RefreshCcw size={16} color={theme.inkSoft} />
          <Text style={styles.secondaryButtonText}>Retry from scratch</Text>
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

function SummaryCard({ memorySet, latestAttempt }: { memorySet: MemorySet; latestAttempt: PracticeAttempt | null }) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const summaryMeta = getSummaryMeta(memorySet, latestAttempt);
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, isPalace ? styles.summaryIconPalace : styles.summaryIconPeg]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.summaryCopy}>
        <Text style={[styles.techniqueLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>
          {isPalace ? 'MEMORY PALACE' : 'NUMBER PEG'}
        </Text>
        <Text style={styles.summaryTitle}>{memorySet.title}</Text>
        <Text style={styles.summaryMeta}>{summaryMeta}</Text>
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

function statusLabel(status: ItemStatus) {
  switch (status) {
    case 'recalled': return 'Recalled';
    case 'needs-review': return 'Review';
    case 'not-tried': return 'Not tried';
    default: return 'Ready';
  }
}

function getSummaryMeta(memorySet: MemorySet, latestAttempt: PracticeAttempt | null) {
  if (!latestAttempt) return `${memorySet.items.length} items · Ready to practice`;
  const latestResponseByItem = new Map(
    latestAttempt.responses.map((response) => [response.memoryItemId, response]),
  );
  const recalledCount = Array.from(latestResponseByItem.values()).filter((response) => response.isCorrect).length;
  const retryCount = latestAttempt.responses.filter((response) => response.attemptCount > 1).length;
  if (latestResponseByItem.size < memorySet.items.length) {
    return `${recalledCount}/${memorySet.items.length} recalled · In progress`;
  }
  if (recalledCount === memorySet.items.length) {
    return retryCount > 0
      ? `${recalledCount}/${memorySet.items.length} recalled · ${retryCount} retried`
      : `${recalledCount}/${memorySet.items.length} recalled · Last round perfect`;
  }
  return `${recalledCount}/${memorySet.items.length} recalled · Keep practicing`;
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
