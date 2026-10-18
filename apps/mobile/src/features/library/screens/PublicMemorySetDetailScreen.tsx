import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySet, useCopyCommunityMemorySet, useReportCommunityMemorySet, useSetCommunityMemorySetHelpful, useSetCommunityMemorySetBookmark } from '@/features/memory-sets';
import type { CommunityMemorySetDetail } from '@/features/memory-sets';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { AppImage } from '@/components/AppImage';
import { Href, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Bookmark, Copy, Flag, RefreshCcw, Share2, Star } from '@/core/icons';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export function PublicMemorySetDetailScreen({ memorySetId }: { memorySetId: string }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const { t: memoryDetailsT } = useTranslation('memoryDetails');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const router = useRouter();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const query = useCommunityMemorySet(memorySetId);
  const copyMutation = useCopyCommunityMemorySet();
  const reportMutation = useReportCommunityMemorySet();
  const helpfulMutation = useSetCommunityMemorySetHelpful();
  const bookmarkMutation = useSetCommunityMemorySetBookmark();
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [confirmReport, setConfirmReport] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [sharing, setSharing] = useState(false);

  if (!isOffline && query.isLoading) return <LoadingView description={t('discoverLoading')} />;
  if (!query.data) return <View style={styles.page}><CommonHeader eyebrow={t('discoverEyebrow')} title={canShowRequestErrors ? t('discoverUnavailable') : t('discoverEyebrow')} backAction={() => router.back()} />{canShowRequestErrors ? <View style={styles.error}><Text style={styles.emptyEmoji}>🫧</Text><Text style={styles.emptyTitle}>{t('discoverUnavailable')}</Text><Text style={styles.emptyBody}>{t('connectionRetry')}</Text><AnimatedPressable onPress={() => void query.refetch()} style={styles.retry}><RefreshCcw size={15} color={theme.onSun} /><Text style={styles.retryText}>{t('retry')}</Text></AnimatedPressable></View> : null}</View>;

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
  const shareMemorySet = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = Linking.createURL(`community/memory-sets/${encodeURIComponent(memorySet.id)}`);
      await Share.share({ message: `${memorySet.title}\n${url}`, title: t('shareCommunityMemoryTitle') });
    } catch {
      Toast.show({ type: 'error', text1: t('shareCommunityMemoryError') });
    } finally {
      setSharing(false);
    }
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
      <View style={styles.stats}><Stat label={t('items')} value={String(memorySet.itemCount)} /><Stat label={t('copies')} value={String(memorySet.copyCount)} /><Stat label={t('helpfulCount')} value={String(memorySet.helpfulCount)} /><Stat label={t('goalLabel')} value={goalLabel(memorySet.goalType, t)} /></View>
      {memorySet.description ? <Text style={styles.description}>{memorySet.description}</Text> : null}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected: memorySet.isBookmarked, disabled: bookmarkMutation.isPending }}
        disabled={bookmarkMutation.isPending}
        onPress={() => bookmarkMutation.mutate({ memorySetId: memorySet.id, isBookmarked: !memorySet.isBookmarked }, {
          onSuccess: () => Toast.show({ type: 'success', text1: t(memorySet.isBookmarked ? 'communityBookmarkRemoved' : 'communityBookmarked') }),
          onError: () => Toast.show({ type: 'error', text1: t('communityBookmarkError') }),
        })}
        style={[styles.helpfulButton, memorySet.isBookmarked && styles.helpfulButtonSelected]}>
        <Bookmark size={17} color={memorySet.isBookmarked ? theme.sunDeep : theme.inkSoft} fill={memorySet.isBookmarked ? theme.sun : 'none'} />
        <Text style={[styles.helpfulText, memorySet.isBookmarked && styles.helpfulTextSelected]}>{t(memorySet.isBookmarked ? 'communityBookmarkRemoveAction' : 'communityBookmarkAction')}</Text>
      </AnimatedPressable>
      {!isAuthor ? <AnimatedPressable
        accessibilityRole="button"
        accessibilityState={{ selected: memorySet.isHelpful, disabled: helpfulMutation.isPending }}
        disabled={helpfulMutation.isPending}
        onPress={() => helpfulMutation.mutate({ memorySetId: memorySet.id, isHelpful: !memorySet.isHelpful }, {
          onError: () => Toast.show({ type: 'error', text1: t('helpfulReactionError') }),
        })}
        style={[styles.helpfulButton, memorySet.isHelpful && styles.helpfulButtonSelected]}>
        <Star size={17} color={memorySet.isHelpful ? theme.sunDeep : theme.inkSoft} fill={memorySet.isHelpful ? theme.sun : 'none'} />
        <Text style={[styles.helpfulText, memorySet.isHelpful && styles.helpfulTextSelected]}>{t(memorySet.isHelpful ? 'removeHelpful' : 'markHelpful')}</Text>
      </AnimatedPressable> : null}
      <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: sharing }} disabled={sharing} onPress={() => void shareMemorySet()} style={styles.shareButton}>
        <Share2 size={16} color={theme.violetDeep} />
        <Text style={styles.shareText}>{t('shareCommunityMemory')}</Text>
      </AnimatedPressable>
      <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('previewItems')}</Text>
      <View style={styles.items}>{memorySet.items.map((item) => <View key={item.id} style={styles.itemRow}><View style={styles.itemNumber}><Text style={styles.itemNumberText}>{item.position}</Text></View><View style={styles.itemCopy}><Text style={styles.itemPrompt}>{localizeItemPrompt(item.prompt, item.position, memoryDetailsT)}</Text><Text numberOfLines={2} style={styles.itemAnswer}>{item.answer}</Text></View></View>)}</View>
      <AnimatedPressable onPress={() => memorySet.existingCopyId ? router.push(`/memory-details/${memorySet.existingCopyId}` as Href) : setConfirmCopy(true)} disabled={copyMutation.isPending} style={styles.copyButton}>{copyMutation.isPending ? <ActivityIndicator color={theme.onSun} /> : <Copy size={18} color={theme.onSun} />}<Text style={styles.copyButtonText}>{copyMutation.isPending ? t('copying') : memorySet.existingCopyId ? t('openOwnCopy') : t('copyToLibrary')}</Text></AnimatedPressable>
      {!isAuthor ? <AnimatedPressable style={styles.reportButton} onPress={() => setConfirmReport(true)}><Flag size={15} color={theme.inkSoft} /><Text style={styles.reportText}>{t('reportMemory')}</Text></AnimatedPressable> : null}
    </ScrollView>
    <ConfirmModal visible={confirmCopy} icon={<Copy size={27} color={theme.violetDeep} />} title={t('copyTitle')} subject={memorySet.title} description={t('copyDescription')} confirmText={t('copyToLibrary')} cancelText={t('cancel')} isLoading={copyMutation.isPending} onConfirm={copy} onCancel={() => setConfirmCopy(false)} />
    <ConfirmModal visible={confirmReport} icon={<Flag size={27} color={theme.berryDeep} />} title={t('reportTitle')} subject={memorySet.title} description={t('reportDescription')} confirmText={t('reportConfirm')} cancelText={t('cancel')} isLoading={reportMutation.isPending} onConfirm={() => { reportMutation.mutate({ memorySetId: memorySet.id, reason: reportReason, details: reportDetails.trim() || undefined }, { onSuccess: () => { setConfirmReport(false); setReportDetails(''); Toast.show({ type: 'success', text1: t('reportThanks') }); }, onError: () => Toast.show({ type: 'error', text1: t('reportError') }) }); }} onCancel={() => setConfirmReport(false)}>
      <View style={styles.reportReasons}>
        {(['inappropriate', 'spam', 'personal-info', 'copyright', 'other'] as const).map((reason) => (
          <AnimatedPressable key={reason} accessibilityRole="radio" accessibilityState={{ checked: reportReason === reason }} onPress={() => setReportReason(reason)} style={[styles.reportReason, reportReason === reason && styles.reportReasonSelected]}>
            <Text style={[styles.reportReasonText, reportReason === reason && styles.reportReasonTextSelected]}>{t(`reportReason_${reason}`)}</Text>
          </AnimatedPressable>
        ))}
        <TextInput
          accessibilityLabel={t('reportDetailsLabel')}
          value={reportDetails}
          onChangeText={(value) => setReportDetails(value.slice(0, 500))}
          placeholder={t('reportDetailsPlaceholder')}
          placeholderTextColor={theme.inkSoft}
          multiline
          maxLength={500}
          style={styles.reportDetailsInput}
        />
      </View>
    </ConfirmModal>
  </View>;
}

function HeroCard({ memorySet, t }: { memorySet: CommunityMemorySetDetail; t: (key: any) => string }) {
  const { styles } = useStyles();
  const isPalace = memorySet.techniqueKey === 'palace';
  const hasPalaceImage = isPalace && Boolean(memorySet.coverImageUrl);

  return (
    <View style={[styles.hero, isPalace ? styles.heroPalace : styles.heroPeg]}>
      {hasPalaceImage ? (
        <>
          <View pointerEvents="none" style={styles.heroBackground}>
            <AppImage imageUrl={memorySet.coverImageUrl ?? undefined} />
          </View>
          <View pointerEvents="none" style={styles.heroOverlay} />
        </>
      ) : <Text style={styles.heroEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>}
      <View style={styles.heroContent}>
        <Text style={[styles.heroTechnique, hasPalaceImage && styles.heroTextOnImage]}>
          {isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}
        </Text>
        <Text style={[styles.heroTitle, hasPalaceImage && styles.heroTextOnImage]}>{memorySet.title}</Text>
        <Text style={[styles.heroMeta, hasPalaceImage && styles.heroMetaOnImage]}>{t('publishedByCommunity')}</Text>
      </View>
    </View>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  const { styles } = useStyles(); return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function goalLabel(goal: string, t: (key: any) => string) { const key = `goal${goal.replace(/(^|-)(.)/g, (_, __, letter) => letter.toUpperCase())}`; return t(key); }
function localizeItemPrompt(prompt: string, position: number, t: (key: any) => string) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  if (normalizedPrompt.startsWith('recall locus')) return `${t('recallLocus')} ${position}`;
  if (normalizedPrompt.startsWith('spell item')) return `${t('spellItem')} ${position}`;
  if (normalizedPrompt.startsWith('recall item')) return `${t('recallItem')} ${position}`;
  return prompt;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: 'transparent', flex: 1 }, content: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', borderRadius: 24, borderWidth: 1.5, justifyContent: 'center', minHeight: 200, overflow: 'hidden', padding: 22 }, heroPalace: { backgroundColor: theme.violetTint, borderColor: theme.violetLine }, heroPeg: { backgroundColor: theme.berryTint, borderColor: theme.berryLine }, heroEmoji: { fontSize: 40 }, heroBackground: { ...StyleSheet.absoluteFillObject, borderRadius: 22, overflow: 'hidden' }, heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 20, 38, 0.52)', borderRadius: 22 }, heroContent: { alignItems: 'center', width: '100%' }, heroTechnique: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 1, marginTop: 9 }, heroTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 24, marginTop: 5, textAlign: 'center' }, heroMeta: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, marginTop: 7 }, heroTextOnImage: { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, heroMetaOnImage: { color: 'rgba(255,255,255,0.86)' },
  ownerCard: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', marginTop: 13, padding: 12 }, avatar: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 21, height: 42, justifyContent: 'center', overflow: 'hidden', width: 42 }, avatarImage: { height: 42, width: 42 }, avatarText: { color: theme.onSun, fontFamily: typography.displayExtraBold, fontSize: 17 }, ownerCopy: { flex: 1, marginLeft: 10 }, ownerLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9, textTransform: 'uppercase' }, ownerName: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, marginTop: 2 }, publicLabel: { backgroundColor: theme.mintTint, borderRadius: 999, color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 9, paddingHorizontal: 8, paddingVertical: 4 },
  stats: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingVertical: 12 }, stat: { alignItems: 'center', flex: 1 }, statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 }, statLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9, marginTop: 2 }, description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20, marginTop: 16 }, sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, marginBottom: 10, marginTop: 23 }, items: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 13 }, itemRow: { alignItems: 'center', borderBottomColor: theme.line, borderBottomWidth: 1, flexDirection: 'row', minHeight: 66 }, itemNumber: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }, itemNumberText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 11 }, itemCopy: { flex: 1, marginLeft: 11 }, itemPrompt: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 }, itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13, marginTop: 3 },
  helpfulButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 13, borderWidth: 1.5, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 14, minHeight: 46, paddingHorizontal: 14 }, helpfulButtonSelected: { backgroundColor: theme.sunTint, borderColor: theme.sunLine }, helpfulText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 }, helpfulTextSelected: { color: theme.sunDeep },
  shareButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1.5, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 10, minHeight: 44, paddingHorizontal: 14 }, shareText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  reportReasons: { alignSelf: 'stretch', gap: 7, marginTop: 14 }, reportReason: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 }, reportReasonSelected: { backgroundColor: theme.berryTint, borderColor: theme.berryLine }, reportReasonText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 }, reportReasonTextSelected: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold }, reportDetailsInput: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, color: theme.ink, fontSize: 13, minHeight: 74, padding: 10, textAlignVertical: 'top' },
  copyButton: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 16, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 20, minHeight: 53 }, copyButtonText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 14 }, reportButton: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 17, minHeight: 44 }, reportText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11 }, error: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, marginTop: 11 }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, marginTop: 5 }, retry: { alignItems: 'center', backgroundColor: theme.sun, borderRadius: 13, flexDirection: 'row', gap: 7, marginTop: 15, paddingHorizontal: 17, paddingVertical: 11 }, retryText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
