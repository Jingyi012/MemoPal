import { ChevronRight, Image as ImageIcon, Sparkles } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAiCredits } from '../hooks/useAiCredits';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { AiCreditToken } from './AiCreditToken';
import { useTranslation } from '@/core/i18n/useTranslation';

export function AiCreditBalanceLink({ compact = false }: { compact?: boolean }) {
  const balance = useAiCredits();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const data = balance.data;
  const { language } = useTranslation('numberPeg'); const zh = language === 'zh';
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={zh ? '打开 AI 点数钱包' : 'Open AI credit wallet'}
      onPress={() => router.push('/ai-credits')} style={[styles.card, compact && styles.compactCard]}>
      <AiCreditToken size={compact ? 36 : 46} />
      <View style={styles.copy}>
        <View style={styles.titleRow}><Text style={styles.title}>{zh ? 'AI 点数' : 'AI credits'}</Text>
          {data?.nextExpiry && <View style={styles.expiringPill}><Text style={styles.expiringText}>{zh ? '即将到期' : 'EXPIRING'}</Text></View>}
        </View>
        <Text style={styles.balance}>{balance.isPending ? '…' : data?.available ?? '—'} <Text style={styles.unit}>{zh ? '可用' : 'available'}</Text></Text>
        {!compact && <View style={styles.metaRow}>
          <View style={styles.meta}><Sparkles size={12} color={theme.inkSoft} /><Text style={styles.metaText}>{data?.textCost ?? '—'} / {zh ? '故事' : 'story'}</Text></View>
          <View style={styles.meta}><ImageIcon size={12} color={theme.inkSoft} /><Text style={styles.metaText}>{data?.imageCost ?? '—'} / {zh ? '图片' : 'image'}</Text></View>
        </View>}
      </View>
      <ChevronRight size={20} color={theme.inkSoft} />
    </AnimatedPressable>
  );
}

/** Small, persistent wallet affordance for page headers. */
export function AiCreditCoinButton() {
  const balance = useAiCredits();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const { language } = useTranslation('numberPeg'); const zh = language === 'zh';
  const available = balance.data?.available;
  const displayBalance = balance.isPending ? '…' : available == null ? '—' : formatCompactCredits(available);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={zh ? `打开 AI 点数钱包，可用 ${available ?? '…'} 点` : `Open AI credit wallet. ${available ?? '…'} credits available`}
      onPress={() => router.push('/ai-credits')}
      pressedStyle={{ backgroundColor: theme.controlPressed }} style={styles.coinButton}>
      <AiCreditToken size={26} />
      <Text style={styles.coinType}>AI</Text>
      <Text style={styles.coinBalance}>{displayBalance}</Text>
    </AnimatedPressable>
  );
}

function formatCompactCredits(value: number) {
  if (value >= 1_000_000) return `${Math.floor(value / 100_000) / 10}m`;
  if (value >= 10_000) return `${Math.floor(value / 1_000)}k`;
  if (value >= 1_000) return `${Math.floor(value / 100) / 10}k`;
  return String(value);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  coinButton: { minWidth: 78, height: 44, paddingHorizontal: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'transparent' },
  coinType: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 12 },
  coinBalance: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper },
  compactCard: { minHeight: 58, paddingVertical: 10 },
  copy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  balance: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 26, marginTop: 1 },
  unit: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 }, metaRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 },
  expiringPill: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: theme.sunTint }, expiringText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12, letterSpacing: 0.4 },
}));
