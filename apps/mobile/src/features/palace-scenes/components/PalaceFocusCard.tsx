import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { AppButton } from '@/components/ui/AppButton';
import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { ChevronLeft, ChevronRight, RotateCcw } from '@/core/icons';
import { StyleSheet, View } from 'react-native';
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
  const { styles } = useStyles();
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

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: {
    backgroundColor: theme.paper,
    borderColor: theme.violetLine,
    borderRadius: appRadii.card,
    borderWidth: 1.5,
    marginBottom: appSpacing.md,
    overflow: 'hidden',
  },
  copy: { paddingHorizontal: appSpacing.lg, paddingTop: 14, paddingBottom: appSpacing.md },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  eyebrow: {
    color: theme.violetDeep,
    flexShrink: 1,
    fontFamily: typography.bodyExtraBold,
    fontSize: appTextStyles.caption.fontSize,
  },
  focusSparkleEmoji: { fontSize: appTextStyles.label.fontSize },
  answer: { color: theme.ink, fontFamily: typography.display, fontSize: appTextStyles.stat.fontSize, marginTop: 5 },
  association: {
    color: theme.inkSoft,
    fontFamily: typography.bodySemibold,
    fontSize: appTextStyles.caption.fontSize,
    lineHeight: appTextStyles.caption.lineHeight,
    marginTop: 5,
  },
  navigationRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingBottom: 14 },
  previousButton: { borderRadius: appRadii.control, height: 46, width: 46 },
  nextButton: { flex: 1, minHeight: 46 },
  disabledButton: { opacity: 0.35 },
}));
