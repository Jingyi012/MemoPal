import { CommonHeader } from '@/components/CommonHeader';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { buildAllNumberPegItems, getUnlockedPegCount, MAX_NUMBER_PEGS } from '@/features/number-peg/utils/numberPegMap';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function NumberPegMapScreen() {
  const router = useRouter();
  const { t } = useTranslation('numberPeg');
  const { user } = useCurrentUser();
  const level = Math.max(1, user?.level ?? 1);
  const unlockedCount = getUnlockedPegCount(level);
  const items = useMemo(() => buildAllNumberPegItems(), []);

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('pegUnlocks')}
        description={t('levelDescription')}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><Text style={styles.summaryEmoji}>🕯️</Text></View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>Level {level} · {unlockedCount}/{MAX_NUMBER_PEGS} unlocked</Text>
            <Text style={styles.summaryBody}>Learn a small set deeply before the next anchors open.</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${unlockedCount}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>ANCHOR LIBRARY</Text>
            <Text style={styles.heading}>Numbers 1–{MAX_NUMBER_PEGS}</Text>
          </View>
          <View style={styles.lockPill}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.lockPillText}>{MAX_NUMBER_PEGS - unlockedCount} locked</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {items.map((item) => (
            <NumberPegItemCard
              key={item.id}
              item={item}
              compact
              locked={item.number > unlockedCount}
            />
          ))}
        </View>

        <AnimatedPressable style={styles.startButton} onPress={() => router.push('/number-peg/create')}>
          <Text style={styles.startButtonText}>Build a memory with these pegs</Text>
          <ArrowRight size={17} color={theme.ink} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderWidth: 2, borderColor: '#FFD9E2', backgroundColor: '#FFF0F4', padding: 13 },
  summaryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
  summaryEmoji: { fontSize: 22 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 14 },
  summaryBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 16, marginTop: 2 },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(255,255,255,.8)', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: theme.berry },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 25, marginBottom: 12 },
  eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 1 },
  heading: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 3 },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: '#F6F3EA', paddingHorizontal: 9, paddingVertical: 6 },
  lockEmoji: { fontSize: 12 },
  lockPillText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  startButton: { minHeight: 50, marginTop: 20, borderRadius: 15, backgroundColor: theme.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0px 5px 0px ${theme.sunDeep}` },
  startButtonText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
});
