import { appSpacing } from '@/theme/designSystem';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useAuth } from '@/contexts/AuthProvider';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useMemorySet, type MemorySet } from '@/features/memory-sets';
import NumberPegSessionScreen from '@/features/number-peg/screens/NumberPegSessionScreen';
import PalaceMemorySessionScreen from '@/features/palace-scenes/screens/PalaceMemorySessionScreen';
import { readNumberPegSession, clearNumberPegSession } from '@/features/number-peg/services/numberPegSessionRecovery';
import { readPalaceSession, clearPalaceSession } from '@/features/palace-scenes/services/palaceSessionRecovery';
import { useMemoryReviewProgress } from '../hooks/usePracticeAttempts';
import { selectReviewSessionItems, type ReviewSessionScope } from '../utils/reviewSession';
import { getSavedReviewItemIds } from '../utils/recallRound';

/** Freeze a server-selected subset once per round, before mounting either player. */
export default function MemoryReviewSessionScreen({ memorySetId, scope }: {
  memorySetId: string; scope: ReviewSessionScope;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('reviewPlan');
  const { t: progressText } = useTranslation('reviewProgress');
  const { isOffline } = useNetworkStatus();
  const memory = useMemorySet(memorySetId);
  const { refetch } = useMemoryReviewProgress(memorySetId);
  const [selection, setSelection] = useState<MemorySet | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const sessionScope = `${scope}:${user?.id ?? 'anonymous'}`;

  useEffect(() => {
    if (!memory.data || selection) return;
    let cancelled = false;
    const set = memory.data;
    setFailed(false);
    void (async () => {
      if (set.status === 'draft') throw new Error('Memory is not ready');
      const palace = set.techniqueKey === 'palace';
      const snapshot = scope === 'browse' ? null : palace
        ? await readPalaceSession(set.id, sessionScope) : await readNumberPegSession(set.id, sessionScope);
      const queue = snapshot && ('questionIndex' in snapshot ? snapshot.questionOrder : snapshot.recallOrder);
      const index = snapshot && ('questionIndex' in snapshot ? snapshot.questionIndex : snapshot.activeIndex);
      const savedIds = snapshot?.memorySetVersion === set.version
        ? getSavedReviewItemIds(set.items, queue || undefined, index ?? -1) : null;
      let items: MemorySet['items'];
      if (savedIds) {
        items = set.items.filter((item) => savedIds.has(item.id));
      } else if (scope === 'browse') {
        items = set.items;
      } else {
        if (isOffline) throw new Error('Connection required for a new round');
        const fresh = await refetch();
        if (fresh.isError || !fresh.data) throw new Error('Review schedule unavailable');
        if (snapshot) await (palace ? clearPalaceSession(set.id, sessionScope) : clearNumberPegSession(set.id, sessionScope));
        items = selectReviewSessionItems(set.items, fresh.data.items, scope);
      }
      if (!cancelled) setSelection({ ...set, items });
    })().catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [memory.data, scope, sessionScope, selection, refetch, retry, isOffline]);

  const back = () => router.replace({ pathname: '/memory-details/[memorySetId]', params: { memorySetId } });
  const unavailable = !selection && (failed || memory.isError || (isOffline && !memory.data));
  if (unavailable || selection?.items.length === 0) return <View style={styles.page}>
    <CommonHeader title={t('taskTitle')} backAction={back} />
    <View style={styles.notice}><ModuleNoticeCard emoji={unavailable ? '☁️' : '✓'}
      title={unavailable ? t('loadError') : t('nothingDue')}
      body={unavailable ? t('connectionRequired') : t('scheduleChanged')}
      actionLabel={unavailable ? progressText('retry') : t('backToMemory')}
      onAction={unavailable ? () => { setSelection(null); setRetry((value) => value + 1); void memory.refetch(); } : back} /></View>
  </View>;
  if (!selection) return <View style={styles.page}><CommonHeader title={t('taskTitle')} backAction={back} />
    <LoadingView description={t('loading')} /></View>;
  const props = {
    memorySetId, sessionMemorySet: selection, sessionScope,
    startInRecall: scope === 'due', browseOnly: scope === 'browse',
    sessionDescription: t(scope === 'due' ? 'roundScope' : scope === 'learn' ? 'learnScope' : 'browseScope')
      .replace('{count}', String(selection.items.length)),
  };
  return selection.techniqueKey === 'palace'
    ? <PalaceMemorySessionScreen {...props} /> : <NumberPegSessionScreen {...props} />;
}

const styles = StyleSheet.create({ page: { flex: 1 }, notice: { padding: appSpacing.xl } });
