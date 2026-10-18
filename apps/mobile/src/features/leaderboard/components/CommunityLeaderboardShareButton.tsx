import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { buildLeaderboardShareSummary } from '@/features/leaderboard/utils/leaderboardShareSummary';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

type CommunityLeaderboardShareButtonProps = Readonly<{
  points: number;
  rank: number | null;
}>;

export function CommunityLeaderboardShareButton({ points, rank }: CommunityLeaderboardShareButtonProps) {
  const { t } = useTranslation('library');
  const { styles, theme } = useStyles();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    setSharing(true);
    const message = buildLeaderboardShareSummary(points, rank, Linking.createURL('community/leaderboard'), {
      summary: value => t('leaderboardShareSummary', { points: value }),
      rank: value => t('leaderboardShareRank', { rank: value }),
      destination: url => t('leaderboardShareLink', { url }),
      privacyNote: t('leaderboardSharePrivacy'),
    });
    try {
      await Share.share({ message, title: t('leaderboardShareTitle') });
      setPreviewOpen(false);
    } catch {
      Toast.show({ type: 'error', text1: t('leaderboardShareError') });
    } finally {
      setSharing(false);
    }
  };

  return <>
    <AnimatedPressable accessibilityRole="button" onPress={() => setPreviewOpen(true)} style={styles.button}>
      <View style={styles.content}>
        <Share2 size={16} color={theme.violetDeep} />
        <Text style={styles.label}>{t('leaderboardShareAction')}</Text>
      </View>
    </AnimatedPressable>
    <Modal visible={previewOpen} transparent animationType="fade" accessibilityViewIsModal onRequestClose={() => setPreviewOpen(false)}>
      <View style={styles.scrim}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('leaderboardSharePreview')}</Text>
            <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('leaderboardShareClose')} onPress={() => setPreviewOpen(false)} style={styles.close}>
              <X size={19} color={theme.inkSoft} />
            </AnimatedPressable>
          </View>
          <LinearGradient colors={[theme.violetDeep, '#7D64D9', '#D277A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <Text style={styles.brand}>{t('leaderboardShareBrand')}</Text>
              <Text style={styles.cardTitle}>{t('leaderboardShareCardTitle')}</Text>
              <View style={styles.metrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{points}</Text>
                  <Text style={styles.metricLabel}>{t('leaderboardSharePoints')}</Text>
                </View>
                {rank != null ? <View style={styles.metric}>
                  <Text style={styles.metricValue}>#{rank}</Text>
                  <Text style={styles.metricLabel}>{t('leaderboardShareRankLabel')}</Text>
                </View> : null}
              </View>
              <Text style={styles.privacy}>{t('leaderboardSharePrivacy')}</Text>
          </LinearGradient>
          <AnimatedPressable accessibilityRole="button" disabled={sharing} onPress={() => void share()} style={[styles.shareButton, sharing && styles.disabled]}>
            <Share2 size={17} color={theme.onAccent} />
            <Text style={styles.shareButtonText}>{sharing ? '…' : t('leaderboardShareText')}</Text>
          </AnimatedPressable>
          {Platform.OS === 'web' ? <Text style={styles.webNote}>{buildLeaderboardShareSummary(points, rank, Linking.createURL('community/leaderboard'), {
            summary: value => t('leaderboardShareSummary', { points: value }),
            rank: value => t('leaderboardShareRank', { rank: value }),
            destination: url => t('leaderboardShareLink', { url }),
            privacyNote: t('leaderboardSharePrivacy'),
          })}</Text> : null}
        </View>
      </View>
    </Modal>
  </>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  content: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  label: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  scrim: { alignItems: 'center', backgroundColor: 'rgba(21,16,38,0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: theme.paper, borderRadius: 22, gap: 14, maxWidth: 460, padding: 16, width: '100%' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  close: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  card: { borderRadius: 22, gap: 14, minHeight: 250, overflow: 'hidden', padding: 22 },
  brand: { color: 'rgba(255,255,255,0.78)', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1.1 },
  cardTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 23, lineHeight: 29, marginTop: 5 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metric: { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 15, borderWidth: 1, flex: 1, gap: 5, minHeight: 74, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  metricValue: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 24 },
  metricLabel: { color: 'rgba(255,255,255,0.92)', fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 14 },
  privacy: { color: 'rgba(255,255,255,0.82)', fontFamily: typography.bodySemibold, fontSize: 9, lineHeight: 13, marginTop: 'auto' },
  shareButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.violetDeep, borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48 },
  shareButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  disabled: { opacity: 0.55 },
  webNote: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16 },
}));
