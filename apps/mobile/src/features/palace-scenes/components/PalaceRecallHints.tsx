import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import { ChevronDown, ChevronUp, Lightbulb } from '@/core/icons';
import type { MemoryItem, PalaceBinding } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export const PALACE_MAX_HINTS = 2;

type Props = {
  item: MemoryItem;
  binding: PalaceBinding | null;
  hintCount: number;
  feedback: 'correct' | 'wrong' | null;
  disabled: boolean;
  onHint: () => void;
};

export function PalaceRecallHints({ item, binding, hintCount, feedback, disabled, onHint }: Props) {
  const { t } = useTranslation('palace');
  const { styles, theme } = useStyles();
  const [expanded, setExpanded] = useState(false);
  const revealed = hintCount >= PALACE_MAX_HINTS;

  useEffect(() => {
    setExpanded(false);
  }, [item.id, feedback]);

  // Answer feedback already includes the answer; avoid repeating it here.
  if (feedback) return null;

  return (
    <View style={styles.container}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? t('collapseHints') : t('hintEntry')}
        accessibilityState={{ disabled, expanded }}
        disabled={disabled}
        onPress={() => {
          if (!expanded && hintCount === 0) onHint();
          setExpanded((value) => !value);
        }}
        style={[styles.trigger, disabled && styles.disabled]}>
        <View style={styles.triggerIcon}>
          <Lightbulb size={15} color={theme.sunDeep} />
        </View>
        <Text style={styles.triggerText}>{expanded ? t('collapseHints') : t('hintEntry')}</Text>
        {expanded
          ? <ChevronUp size={14} color={theme.inkSoft} />
          : <ChevronDown size={14} color={theme.inkSoft} />}
      </AnimatedPressable>
      {expanded ? (
        <View style={styles.content} accessibilityLiveRegion="polite">
          <View style={styles.contentHeader}>
            <Text style={styles.label}>{t('associationHint')}</Text>
          </View>
          <Text style={styles.body}>{binding?.associationText || t('associationHintMissing')}</Text>
          {revealed ? (
            <View style={styles.answerRow}>
              <Text style={styles.label}>{t('recallAnswerLabel')}</Text>
              <Text selectable style={styles.answer}>{item.answer}</Text>
            </View>
          ) : (
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              disabled={disabled}
              onPress={onHint}
              style={[styles.revealButton, disabled && styles.disabled]}>
              <Text style={styles.revealText}>{t('showAnswerAndAssociation')}</Text>
            </AnimatedPressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  container: { alignSelf: 'stretch' },
  trigger: { minHeight: 44, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: appSpacing.sm, paddingHorizontal: 0 },
  triggerIcon: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.sunTint },
  triggerText: { color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  disabled: { opacity: 0.5 },
  content: { borderRadius: appRadii.control, borderWidth: 1, borderLeftWidth: 3, borderColor: theme.line, borderLeftColor: theme.sunDeep, backgroundColor: theme.paper, paddingHorizontal: 14, paddingTop: appSpacing.md, paddingBottom: 10, gap: appSpacing.sm },
  contentHeader: { minHeight: 20, flexDirection: 'row', alignItems: 'center', gap: appSpacing.sm },
  label: { flex: 1, color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.15 },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  answerRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, marginTop: 6, paddingTop: appSpacing.md, gap: appSpacing.xs },
  answer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  revealButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  revealText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
}));
