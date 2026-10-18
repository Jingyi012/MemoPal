import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { buildProgressShareMessage } from '@/features/gamification/shared/utils/progressShare';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

type ProgressShareCardButtonProps = Readonly<{
  streak: number;
  activeDays: number;
  weeklySessions: number;
  copy: Readonly<{
    button: string;
    brand: string;
    close: string;
    previewTitle: string;
    cardTitle: string;
    streak: string;
    activeDays: string;
    sessions: string;
    privacyNote: string;
    shareImage: string;
    shareText: string;
    shareError: string;
  }>;
}>;

export function ProgressShareCardButton({ streak, activeDays, weeklySessions, copy }: ProgressShareCardButtonProps) {
  const { styles, theme } = useStyles();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    setSharing(true);
    try {
      const message = buildProgressShareMessage(streak, activeDays, weeklySessions, copy);
      await Share.share({ message, title: copy.previewTitle });
      setPreviewOpen(false);
    } catch {
      Toast.show({ type: 'error', text1: copy.shareError });
    } finally {
      setSharing(false);
    }
  };

  return <>
    <AnimatedPressable accessibilityRole="button" onPress={() => setPreviewOpen(true)} style={styles.button}>
      <Share2 size={16} color={theme.violetDeep} />
      <Text style={styles.buttonText}>{copy.button}</Text>
    </AnimatedPressable>
    <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
      <View style={styles.scrim}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{copy.previewTitle}</Text>
            <AnimatedPressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={() => setPreviewOpen(false)} style={styles.close}>
              <X size={19} color={theme.inkSoft} />
            </AnimatedPressable>
          </View>
          <LinearGradient colors={[theme.violetDeep, '#7D64D9', '#D277A1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
              <Text style={styles.brand}>{copy.brand}</Text>
              <Text style={styles.cardTitle}>{copy.cardTitle}</Text>
              <View style={styles.metrics}>
                <Metric value={streak} label={copy.streak} styles={styles} />
                <Metric value={activeDays} label={copy.activeDays} styles={styles} />
                <Metric value={weeklySessions} label={copy.sessions} styles={styles} />
              </View>
              <Text style={styles.privacy}>{copy.privacyNote}</Text>
          </LinearGradient>
          <AnimatedPressable accessibilityRole="button" disabled={sharing} onPress={() => void share()} style={[styles.shareButton, sharing && styles.disabled]}>
            <Share2 size={17} color={theme.onAccent} />
            <Text style={styles.shareButtonText}>{sharing ? '…' : copy.shareText}</Text>
          </AnimatedPressable>
          {Platform.OS === 'web' ? <Text style={styles.webNote}>{copy.shareText}</Text> : null}
        </View>
      </View>
    </Modal>
  </>;
}

function Metric({ value, label, styles }: { value: number; label: string; styles: ReturnType<typeof useStyles>['styles'] }) {
  return <View style={styles.metric}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  button: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 44, paddingHorizontal: 14 },
  buttonText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  scrim: { alignItems: 'center', backgroundColor: 'rgba(21,16,38,0.62)', flex: 1, justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: theme.paper, borderRadius: 22, gap: 14, maxWidth: 460, padding: 16, width: '100%' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17 },
  close: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  card: { borderRadius: 22, gap: 14, minHeight: 270, overflow: 'hidden', padding: 22 },
  brand: { color: 'rgba(255,255,255,0.78)', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1.1 },
  cardTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 23, lineHeight: 29, marginTop: 5 },
  metrics: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metric: { backgroundColor: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 15, borderWidth: 1, flex: 1, gap: 5, minHeight: 74, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  metricValue: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 22 },
  metricLabel: { color: 'rgba(255,255,255,0.92)', fontFamily: typography.bodyBold, fontSize: 9, lineHeight: 13 },
  privacy: { color: 'rgba(255,255,255,0.82)', fontFamily: typography.bodySemibold, fontSize: 9, lineHeight: 13, marginTop: 'auto' },
  shareButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.violetDeep, borderRadius: 14, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48 },
  shareButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  disabled: { opacity: 0.55 },
  webNote: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16 },
}));
