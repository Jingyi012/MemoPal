import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Coins, History, Plus, Sparkles, WalletCards } from '@/core/icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { useTranslation } from '@/core/i18n/useTranslation';
import { CommonHeader } from '@/components/CommonHeader';
import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useAiCredits, useAiGenerations } from '../hooks/useAiCredits';
import { aiCreditsApi, type AiCreditEntry } from '../api/aiCredits.api';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function AiCreditsScreen() {
  const { user } = useAuth(); const { language } = useTranslation('numberPeg'); const zh = language === 'zh';
  const router = useRouter();
  const balance = useAiCredits(); const generations = useAiGenerations(); const [skip, setSkip] = useState(0); const [historyEntries, setHistoryEntries] = useState<AiCreditEntry[]>([]); const [historyHasMore, setHistoryHasMore] = useState(false);
  const { styles, theme } = useStyles();
  const { canShowRequestErrors } = useNetworkStatus();
  const history = useQuery({ queryKey: ['ai-credits', user?.id, 'history', skip], queryFn: () => aiCreditsApi.history(skip), enabled: Boolean(user), staleTime: 0 });
  useEffect(() => {
    if (!history.data) return;
    setHistoryEntries((current) => {
      if (skip === 0) return history.data;
      const known = new Set(current.map((entry) => entry.id));
      return [...current, ...history.data.filter((entry) => !known.has(entry.id))];
    });
    setHistoryHasMore(history.data.length === 50);
  }, [history.data, skip]);
  const refresh = () => { setSkip(0); setHistoryEntries([]); setHistoryHasMore(false); void balance.refetch(); void generations.refetch(); void history.refetch(); };
  const labels: Record<string, string> = zh ? { grant: '发放', 'leaderboard-reward': '排行榜奖励', reserve: '预留', release: '释放预留', charge: '实际扣费', expire: '到期' } : { grant: 'Granted', 'leaderboard-reward': 'Leaderboard reward', reserve: 'Reserved', release: 'Hold released', charge: 'Charged', expire: 'Expired' };
  const states: Record<string, string> = zh ? { reserved: '排队中', processing: '生成中', completed: '已完成', failed: '失败 · 未扣费' } : { reserved: 'Queued', processing: 'Generating', completed: 'Completed', failed: 'Failed · no charge' };
  const visibleGenerations = generations.data?.filter((job) => job.status !== 'failed').slice(0, 5) ?? [];
  const failedGenerationCount = generations.data?.filter((job) => job.status === 'failed').length ?? 0;
  const visibleHistory = historyEntries.filter((entry) => ['grant', 'leaderboard-reward', 'charge', 'expire'].includes(entry.kind));
  return <View style={styles.page}>
    <CommonHeader title={zh ? 'AI credit 钱包' : 'AI credit wallet'} showAiCredits={false} />
    <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={balance.isRefetching || generations.isRefetching || history.isRefetching} onRefresh={refresh} />} contentContainerStyle={styles.content}>
      <LinearGradient colors={[theme.night, theme.nightDeep]} start={[0, 0]} end={[1, 1]} style={styles.hero}><View pointerEvents="none" style={styles.heroGlow} /><View style={styles.heroTop}><View style={styles.heroIcon}><Coins size={25} color={theme.onAccent} strokeWidth={2.5} /></View><View style={styles.heroBadge}><Sparkles size={12} color={theme.sun} /><Text style={styles.heroBadgeText}>{zh ? 'AI 钱包' : 'AI WALLET'}</Text></View></View><Text style={styles.heroKicker}>{zh ? '可用于 AI 联想' : 'READY FOR AI CREATION'}</Text><Text style={styles.heroNumber}>{balance.isPending ? '…' : balance.data?.available ?? 0}</Text><Text style={styles.heroLabel}>{zh ? '当前可用 credits' : 'credits available'}</Text><View style={styles.heroFoot}><Text style={styles.heroFootText}>{zh ? '故事' : 'Story'} {balance.data?.textCost ?? '—'} · {zh ? '图片' : 'Image'} {balance.data?.imageCost ?? '—'}</Text><Sparkles size={15} color={theme.sun} /></View></LinearGradient>
      {balance.data && <View style={styles.breakdown}><View style={styles.breakdownCell}><Text style={styles.breakdownValue}>{balance.data.subscription}</Text><Text style={styles.breakdownLabel}>{zh ? '订阅赠送' : 'Subscription'}</Text></View><View style={styles.divider} /><View style={styles.breakdownCell}><Text style={styles.breakdownValue}>{balance.data.purchased}</Text><Text style={styles.breakdownLabel}>{zh ? '充值／其他' : 'Purchased'}</Text></View></View>}
      <AnimatedPressable
        accessibilityLabel={zh ? '购买 AI credits' : 'Buy AI credits'}
        onPress={() => router.push('/buy-ai-credits')}
        style={styles.buyButton}>
        <View style={styles.buyIcon}><Plus size={18} color={theme.onAccent} strokeWidth={3} /></View>
        <View style={styles.buyCopy}>
          <Text style={styles.buyTitle}>{zh ? '补充 AI credits' : 'Get more AI credits'}</Text>
          <Text style={styles.buySubtitle}>{balance.data?.purchasesEnabled
            ? (zh ? '查看可用充值方案' : 'See available top-up options')
            : (zh ? '了解充值与订阅方案' : 'Explore top-ups and subscription options')}</Text>
        </View>
        <Text style={styles.buyArrow}>›</Text>
      </AnimatedPressable>
      {balance.data?.nextExpiry && <View style={styles.notice}><WalletCards size={16} color={theme.ink} /><Text style={styles.noticeText}>{zh ? `有额度将在 ${new Date(balance.data.nextExpiry).toLocaleDateString()} 到期，系统会优先使用。` : `Some credits expire on ${new Date(balance.data.nextExpiry).toLocaleDateString()} and will be used first.`}</Text></View>}
      <View style={styles.infoCard}><Text style={styles.sectionTitle}>{zh ? '怎么使用' : 'How credits work'}</Text><Text style={styles.body}>{zh ? 'AI 联想故事和图片会消耗 credits。手动编辑、模板联想和查看历史结果免费。充值功能将在支付接入后开放。' : 'AI stories and illustrations use credits. Manual editing, templates, and viewing saved results are free. Top-ups will open after billing is connected.'}</Text></View>
      {canShowRequestErrors && (balance.isError || history.isError || generations.isError) && <View style={styles.error}><Text style={styles.errorText}>{zh ? '加载失败，点击重试。' : 'Could not load wallet. Tap to retry.'}</Text><AnimatedPressable onPress={refresh} style={styles.retry}><Text style={styles.retryText}>{zh ? '重试' : 'Retry'}</Text></AnimatedPressable></View>}
      <View style={styles.sectionHeader}><History size={17} color={theme.violetDeep} /><Text style={styles.sectionTitle}>{zh ? '最近生成' : 'Recent generations'}</Text></View>
      {generations.isPending && <ActivityIndicator color={theme.violetDeep} />}
      {visibleGenerations.length === 0 && <Text style={styles.empty}>{failedGenerationCount > 0
        ? (zh ? `最近 ${failedGenerationCount} 次生成未成功，未扣除 credits。` : `${failedGenerationCount} recent generations failed. No credits were charged.`)
        : (zh ? '还没有 AI 生成记录。' : 'No AI generations yet.')}</Text>}
      {visibleGenerations.map((job) => <View key={job.id} style={styles.job}><View style={styles.jobTop}><View style={styles.jobStatusPill}><Text style={styles.jobStatus}>{states[job.status] ?? job.status}</Text></View><Text style={styles.jobCost}>{job.charged} credits</Text></View><View style={styles.jobMeta}><Text style={styles.jobKind}>{job.kind === 'number-peg-story' ? (zh ? '数字桩联想故事' : 'Number peg story') : job.kind === 'number-peg-image' ? (zh ? '数字桩联想图片' : 'Number peg image') : job.kind}</Text><Text style={styles.jobDate}>{new Date(job.createdAt).toLocaleDateString()}</Text></View></View>)}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{zh ? '额度流水' : 'Credit history'}</Text></View>
      {visibleHistory.map((entry) => <View key={entry.id} style={styles.historyRow}><Text style={styles.historyKind}>{labels[entry.kind] ?? entry.kind}</Text><Text numberOfLines={1} style={[styles.historyAmount, entry.amount < 0 && styles.negative]}>{entry.amount > 0 ? '+' : ''}{entry.amount}</Text><Text style={styles.historyDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text></View>)}
      {visibleHistory.length === 0 && <Text style={styles.empty}>{zh ? '还没有可显示的额度变化。' : 'No credit changes to display yet.'}</Text>}
      {historyEntries.length > 0 && historyHasMore && <AnimatedPressable disabled={history.isFetching} onPress={() => setSkip((current) => current + 50)} style={styles.loadMoreButton}><Text style={styles.loadMoreText}>{history.isFetching ? (zh ? '加载中…' : 'Loading…') : (zh ? '加载更多' : 'Load more')}</Text></AnimatedPressable>}
    </ScrollView>
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas }, content: { padding: 16, gap: 14, paddingBottom: 36 }, hero: { borderRadius: 28, padding: 20, overflow: 'hidden' }, heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, top: -86, right: -48, backgroundColor: 'rgba(255,201,60,0.12)' }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(155,140,255,0.3)' }, heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.1)' }, heroBadgeText: { color: 'rgba(255,255,255,0.82)', fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.6 }, heroKicker: { color: theme.sun, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1, marginTop: 18 }, heroNumber: { color: '#FFF', fontFamily: typography.displayExtraBold, fontSize: 54, lineHeight: 60, marginTop: 1 }, heroLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: typography.bodySemibold, fontSize: 13 }, heroFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', marginTop: 18, paddingTop: 12 }, heroFootText: { color: 'rgba(255,255,255,0.76)', fontFamily: typography.bodySemibold, fontSize: 11 }, breakdown: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line }, breakdownCell: { flex: 1, alignItems: 'center' }, breakdownValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22 }, breakdownLabel: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 2 }, divider: { width: 1, height: 32, backgroundColor: theme.line }, notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 15, backgroundColor: theme.sunTint }, noticeText: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 17 }, infoCard: { padding: 16, borderRadius: 20, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingHorizontal: 2 }, sectionTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 }, body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 19, marginTop: 7 }, error: { padding: 14, borderRadius: 16, backgroundColor: theme.berryTint, borderWidth: 1, borderColor: theme.berryLine }, errorText: { color: theme.berryDeep, fontFamily: typography.bodySemibold, fontSize: 12 }, retry: { minHeight: 40, marginTop: 8, justifyContent: 'center' }, retryText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }, empty: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 }, job: { padding: 16, borderRadius: 20, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, gap: 8 }, jobTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 3 }, jobStatus: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, jobStatusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: theme.mintTint }, jobCost: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, jobMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, jobKind: { flex: 1, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11 }, jobDate: { color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 10 }, historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.line }, historyKind: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 12 }, historyAmount: { flexShrink: 0, textAlign: 'right', color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 12 }, negative: { color: theme.berryDeep, }, historyDate: { width: 80, textAlign: 'right', color: theme.inkMuted, fontFamily: typography.bodySemibold, fontSize: 10 }, loadMoreButton: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint, borderWidth: 1.5, borderColor: theme.violetLine }, loadMoreText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  buyButton: { minHeight: 76, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.violetTint, borderWidth: 1.5, borderColor: theme.violetLine },
  buyIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetDeep },
  buyCopy: { flex: 1, minWidth: 0 }, buyTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 }, buySubtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 2 }, buyArrow: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 28, lineHeight: 30 },
}));
