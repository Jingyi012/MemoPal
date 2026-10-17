import { ChevronRight, Coins, Image as ImageIcon, Sparkles } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useAiCredits } from '../hooks/useAiCredits';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export function AiCreditBalanceLink({ compact = false }: { compact?: boolean }) {
  const balance = useAiCredits();
  const router = useRouter();
  const { styles, theme } = useStyles();
  const data = balance.data;
  return (
    <AnimatedPressable accessibilityRole="button" accessibilityLabel="Open AI credit wallet"
      onPress={() => router.push('/ai-credits')} style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.iconWrap}><Coins size={compact ? 18 : 22} color={theme.onAccent} strokeWidth={2.5} /></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}><Text style={styles.title}>AI credits</Text>
          {data?.nextExpiry && <View style={styles.expiringPill}><Text style={styles.expiringText}>EXPIRING</Text></View>}
        </View>
        <Text style={styles.balance}>{balance.isPending ? '…' : data?.available ?? 0} <Text style={styles.unit}>available</Text></Text>
        {!compact && <View style={styles.metaRow}>
          <View style={styles.meta}><Sparkles size={12} color={theme.inkSoft} /><Text style={styles.metaText}>{data?.textCost ?? '—'} / story</Text></View>
          <View style={styles.meta}><ImageIcon size={12} color={theme.inkSoft} /><Text style={styles.metaText}>{data?.imageCost ?? '—'} / image</Text></View>
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
  const available = balance.data?.available ?? 0;
  const displayBalance = balance.isPending ? '…' : formatCompactCredits(available);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`Open AI credit wallet. ${available} credits available`}
      onPress={() => router.push('/ai-credits')}
      style={styles.coinButton}>
      <View style={styles.coinIcon}>
        <Sparkles size={14} color={theme.violetDeep} strokeWidth={2.5} />
      </View>
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
  coinButton: { minWidth: 78, height: 44, paddingHorizontal: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: theme.violetTint, borderWidth: 1.5, borderColor: theme.violetLine },
  coinIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  coinType: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 10 },
  coinBalance: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 14, borderRadius: 20, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetTint },
  compactCard: { minHeight: 58, paddingVertical: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetDeep },
  copy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  balance: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 26, marginTop: 1 },
  unit: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11 }, metaRow: { flexDirection: 'row', gap: 12, marginTop: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metaText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10 },
  expiringPill: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: theme.sunTint }, expiringText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.4 },
}));
