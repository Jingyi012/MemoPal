import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { CommonHeader } from '@/components/CommonHeader';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { buildAllNumberPegItems, getUnlockedPegCount, MAX_NUMBER_PEGS } from '@/features/number-peg/utils/numberPegMap';
import { useRouter } from 'expo-router';
import { ArrowRight } from '@/core/icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { typography } from '@/theme/typography';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function NumberPegMapScreen() {
  const { styles } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('numberPeg');
  const { user } = useCurrentUser();
  const level = Math.max(1, user?.level ?? 1);
  const unlockedCount = getUnlockedPegCount(level);
  const items = useMemo(() => buildAllNumberPegItems(), []);

  return (
    <View style={styles.page}>
      <CommonHeader showAiCredits={false}
        eyebrow={t('eyebrow')}
        title={t('pegUnlocks')}
        description={t('levelDescription')}
        backAction={() => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}><Text style={styles.summaryEmoji}>🕯️</Text></View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>{t('levelUnlockedSummary').replace('{level}', String(level)).replace('{count}', String(unlockedCount)).replace('{total}', String(MAX_NUMBER_PEGS))}</Text>
            <Text style={styles.summaryBody}>{t('anchorProgressBody')}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${unlockedCount}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow}>{t('anchorLibrary')}</Text>
            <Text style={styles.heading}>{t('numbersRange').replace('{total}', String(MAX_NUMBER_PEGS))}</Text>
          </View>
          <View style={styles.lockPill}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.lockPillText}>{t('lockedCount').replace('{count}', String(MAX_NUMBER_PEGS - unlockedCount))}</Text>
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

        <AppButton
          label={t('buildMemoryWithPegs')}
          variant="primary"
          size="large"
          fullWidth
          trailingIcon={ArrowRight}
          onPress={() => router.push('/number-peg/create')}
          style={styles.startButton}
        />
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: appSpacing.lg, paddingBottom: appSpacing.spacious },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: appRadii.card, borderWidth: 2, borderColor: theme.berryLine, backgroundColor: theme.berryTint, padding: 13 },
  summaryIcon: { width: 40, height: 40, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  summaryEmoji: { fontSize: appArtworkSizes.small },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.label.fontSize },
  summaryBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, marginTop: 2 },
  progressTrack: { height: 6, overflow: 'hidden', borderRadius: appRadii.pill, backgroundColor: 'rgba(255,255,255,.8)', marginTop: appSpacing.sm },
  progressFill: { height: '100%', borderRadius: appRadii.pill, backgroundColor: theme.berry },
  headingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 25, marginBottom: appSpacing.md },
  eyebrow: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 1 },
  heading: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.sectionTitle.fontSize, marginTop: 3 },
  lockPill: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.xs, borderRadius: appRadii.pill, backgroundColor: theme.violetTint, paddingHorizontal: 9, paddingVertical: 6 },
  lockEmoji: { fontSize: appTextStyles.caption.fontSize },
  lockPillText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  startButton: { marginTop: appSpacing.xl },
}));
