import { AppButton } from '@/components/ui/AppButton';
import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { ChevronLeft, ChevronRight, RotateCcw } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { getPalaceLocusName } from '@/features/palace-scenes/utils/palaceLocalization';

type PalaceFocusCardProps = {
  locus: PalaceLocus;
  answer: string;
  association?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
  isLast?: boolean;
};

export function PalaceFocusCard({
  locus,
  answer,
  association,
  onPrevious,
  onNext,
  isLast = false,
}: PalaceFocusCardProps) {
  const { language, t } = useTranslation('palace');
  const localizedLocusName = getPalaceLocusName(locus, language);

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.focusSparkleEmoji}>✨</Text>
          <Text style={styles.eyebrow}>{localizedLocusName}</Text>
        </View>
        <Text style={styles.answer}>{answer}</Text>
        {association ? (
          <Text style={styles.association}>{association}</Text>
        ) : null}
      </View>
      {onPrevious || onNext ? (
        <View style={styles.navigationRow}>
          <AppButton
            accessibilityLabel={t('previousLocus')}
            disabled={!onPrevious}
            icon={ChevronLeft}
            onPress={() => onPrevious?.()}
            size="compact"
            style={[styles.previousButton, !onPrevious && styles.disabledButton]}
            variant="icon"
          />
          {onNext ? (
            <AppButton
              label={isLast ? t('restartWalk') : t('nextLocus')}
              trailingIcon={isLast ? RotateCcw : ChevronRight}
              onPress={onNext}
              size="compact"
              style={styles.nextButton}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.paper,
    borderColor: '#DCD4FF',
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  copy: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  eyebrow: {
    color: theme.violetDeep,
    flexShrink: 1,
    fontFamily: typography.bodyExtraBold,
    fontSize: 12,
  },
  focusSparkleEmoji: { fontSize: 14 },
  answer: { color: theme.ink, fontFamily: typography.display, fontSize: 23, marginTop: 5 },
  association: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  navigationRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  previousButton: { borderRadius: 15, height: 46, width: 46 },
  nextButton: { flex: 1, minHeight: 46 },
  disabledButton: { opacity: 0.35 },
});
