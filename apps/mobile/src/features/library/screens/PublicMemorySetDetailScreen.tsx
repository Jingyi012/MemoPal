import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySet, useCopyCommunityMemorySet, useReportCommunityMemorySet } from '@/features/memory-sets';
import type { CommunityMemorySetDetail } from '@/features/memory-sets';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { AppImage } from '@/components/AppImage';
import { Href, useRouter } from 'expo-router';
import { Copy, Flag, RefreshCcw } from 'lucide-react-native';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';

export function PublicMemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const { t } = useTranslation('library');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const router = useRouter();
  const query = useCommunityMemorySet(memorySetId);
  const copyMutation = useCopyCommunityMemorySet();
  const reportMutation = useReportCommunityMemorySet();
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [confirmReport, setConfirmReport] = useState(false);

  if (query.isLoading) return <LoadingView description={t('discoverLoading')} />;
  if (query.isError || !query.data) return <View style={styles.page}><CommonHeader eyebrow={t('discoverEyebrow')} title={t('discoverUnavailable')} backAction={() => router.back()} /><View style={styles.error}><Text style={styles.emptyEmoji}>🫧</Text><Text style={styles.emptyTitle}>{t('discoverUnavailable')}</Text><Text style={styles.emptyBody}>{t('connectionRetry')}</Text><AnimatedPressable onPress={() => void query.refetch()} style={styles.retry}><RefreshCcw size={15} color={theme.ink} /><Text style={styles.retryText}>{t('retry')}</Text></AnimatedPressable></View></View>;

  const memorySet = query.data;
  const isAuthor = memorySet.existingCopyId === memorySet.id;
  const copy = () => {
    setConfirmCopy(false);
    copyMutation.mutate(memorySet.id, {
      onSuccess: (result) => {
        Toast.show({ type: 'success', text1: result.alreadyCopied ? t('alreadyInLibrary') : t('copiedToLibrary') });
        router.replace(`/memory-details/${result.memorySet.id}` as Href);
      },
      onError: (error) => Toast.show({ type: 'error', text1: t('copyError'), text2: getNumberPegErrorMessage(error, t('copyError')) }),
    });
  };

  return <View style={styles.page}>
    <CommonHeader eyebrow={t('publicMemory')} title={t('details')} backAction={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <HeroCard memorySet={memorySet} t={t} />
      <View style={styles.ownerCard}>
        <View style={styles.avatar}>{memorySet.author.avatarUrl ? <AppImage imageUrl={memorySet.author.avatarUrl} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{memorySet.author.displayName.slice(0, 1).toUpperCase()}</Text>}</View>
        <View style={styles.ownerCopy}><Text style={styles.ownerLabel}>{t('createdBy')}</Text><Text style={styles.ownerName}>{memorySet.author.displayName}</Text></View>
        <Text style={styles.publicLabel}>{t('publicBadge')}</Text>
      </View>
      <View style={styles.stats}><Stat label={t('items')} value={String(memorySet.itemCount)} /><Stat label={t('copies')} value={String(memorySet.copyCount)} /><Stat label={t('goalLabel')} value={goalLabel(memorySet.goalType, t)} /></View>
      {memorySet.description ? <Text style={styles.description}>{memorySet.description}</Text> : null}
      <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('previewItems')}</Text>
      <View style={styles.items}>{memorySet.items.map((item) => <View key={item.id} style={styles.itemRow}><View style={styles.itemNumber}><Text style={styles.itemNumberText}>{item.position}</Text></View><View style={styles.itemCopy}><Text style={styles.itemPrompt}>{item.prompt}</Text><Text numberOfLines={2} style={styles.itemAnswer}>{item.answer}</Text></View></View>)}</View>
      <AnimatedPressable onPress={() => memorySet.existingCopyId ? router.push(`/memory-details/${memorySet.existingCopyId}` as Href) : setConfirmCopy(true)} disabled={copyMutation.isPending} style={styles.copyButton}>{copyMutation.isPending ? <ActivityIndicator color={theme.ink} /> : <Copy size={18} color={theme.ink} />}<Text style={styles.copyButtonText}>{copyMutation.isPending ? t('copying') : memorySet.existingCopyId ? t('openOwnCopy') : t('copyToLibrary')}</Text></AnimatedPressable>
      {!isAuthor ? <AnimatedPressable style={styles.reportButton} onPress={() => setConfirmReport(true)}><Flag size={15} color={theme.inkSoft} /><Text style={styles.reportText}>{t('reportMemory')}</Text></AnimatedPressable> : null}
    </ScrollView>
    <ConfirmModal visible={confirmCopy} icon={<Copy size={27} color={theme.violetDeep} />} title={t('copyTitle')} subject={memorySet.title} description={t('copyDescription')} confirmText={t('copyToLibrary')} cancelText={t('cancel')} isLoading={copyMutation.isPending} onConfirm={copy} onCancel={() => setConfirmCopy(false)} />
    <ConfirmModal visible={confirmReport} icon={<Flag size={27} color={theme.berryDeep} />} title={t('reportTitle')} subject={memorySet.title} description={t('reportDescription')} confirmText={t('reportConfirm')} cancelText={t('cancel')} isLoading={reportMutation.isPending} onConfirm={() => { reportMutation.mutate({ memorySetId: memorySet.id, reason: 'inappropriate' }, { onSuccess: () => { setConfirmReport(false); Toast.show({ type: 'success', text1: t('reportThanks') }); }, onError: () => { setConfirmReport(false); Toast.show({ type: 'error', text1: t('reportError') }); } }); }} onCancel={() => setConfirmReport(false)} />
  </View>;
}

function HeroCard({ memorySet, t }: { memorySet: CommunityMemorySetDetail; t: (key: any) => string }) {
  const isPalace = memorySet.techniqueKey === 'palace';
  return <View style={[styles.hero, isPalace ? styles.heroPalace : styles.heroPeg]}><Text style={styles.heroEmoji}>{isPalace ? '🏰' : '🕯️'}</Text><Text style={styles.heroTechnique}>{isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}</Text><Text style={styles.heroTitle}>{memorySet.title}</Text><Text style={styles.heroMeta}>{t('publishedByCommunity')}</Text></View>;
}
function Stat({ label, value }: { label: string; value: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function goalLabel(goal: string, t: (key: any) => string) { const key = `goal${goal.replace(/(^|-)(.)/g, (_, __, letter) => letter.toUpperCase())}`; return t(key); }

const styles = StyleSheet.create({
  page: { backgroundColor: 'transparent', flex: 1 }, content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', borderRadius: 24, borderWidth: 1.5, padding: 22 }, heroPalace: { backgroundColor: theme.violetTint, borderColor: theme.violetLine }, heroPeg: { backgroundColor: theme.berryTint, borderColor: theme.berryLine }, heroEmoji: { fontSize: 40 }, heroTechnique: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 1, marginTop: 9 }, heroTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 24, marginTop: 5, textAlign: 'center' }, heroMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 7 },
  ownerCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', marginTop: 13, padding: 12 }, avatar: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 21, height: 42, justifyContent: 'center', overflow: 'hidden', width: 42 }, avatarImage: { height: 42, width: 42 }, avatarText: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 }, ownerCopy: { flex: 1, marginLeft: 10 }, ownerLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9, textTransform: 'uppercase' }, ownerName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, marginTop: 2 }, publicLabel: { backgroundColor: '#E9F8F1', borderRadius: 999, color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 9, paddingHorizontal: 8, paddingVertical: 4 },
  stats: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingVertical: 12 }, stat: { alignItems: 'center', flex: 1 }, statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 }, statLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9, marginTop: 2 }, description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20, marginTop: 16 }, sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, marginBottom: 10, marginTop: 23 }, items: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 13 }, itemRow: { alignItems: 'center', borderBottomColor: theme.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 66 }, itemNumber: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }, itemNumberText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 11 }, itemCopy: { flex: 1, marginLeft: 11 }, itemPrompt: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 }, itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 3 },
  copyButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 20, minHeight: 53 }, copyButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 }, reportButton: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 17, minHeight: 44 }, reportText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 }, error: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, marginTop: 11 }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, marginTop: 5 }, retry: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 13, flexDirection: 'row', gap: 7, marginTop: 15, paddingHorizontal: 17, paddingVertical: 11 }, retryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
});
