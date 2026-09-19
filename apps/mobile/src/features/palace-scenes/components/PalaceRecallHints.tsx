import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryItem, PalaceBinding } from '@/features/memory-sets';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Lightbulb, LockKeyhole, MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

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
  const { styles } = useStyles();
  const revealed = hintCount >= 3 || feedback === 'wrong';
  const actionLabel = hintCount === 0 ? t('showAssociationHint')
    : hintCount === 1 ? t('showStoryClue') : t('showAnswerAndAssociation');

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <View style={styles.iconCircle}><Lightbulb size={15} color={styles.icon.color} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{t('hintTitle')}</Text>
        </View>
        <Text style={styles.counter}>{hintCount}/3</Text>
      </View>
      <View style={styles.steps}>
        <View style={styles.step}>
          <View style={[styles.stepDot, hintCount > 0 && styles.stepDotDone]}>
            {hintCount > 0 ? <Check size={12} color={styles.stepCheck.color} /> : <MapPin size={13} color={styles.stepNumber.color} />}
          </View>
          <Text style={[styles.stepText, hintCount > 0 && styles.stepTextDone]}>{t('associationHint')}</Text>
        </View>
        <View style={[styles.connector, hintCount > 0 && styles.connectorDone]} />
        <View style={styles.step}>
          <View style={[styles.stepDot, revealed && styles.stepDotDone]}>
            {revealed ? <Check size={12} color={styles.stepCheck.color} /> : <LockKeyhole size={12} color={styles.stepNumber.color} />}
          </View>
          <Text style={[styles.stepText, hintCount >= 2 && styles.stepTextDone]}>{t('showStoryClue')}</Text>
        </View>
        <View style={[styles.connector, hintCount >= 2 && styles.connectorDone]} />
        <View style={styles.step}>
          <View style={[styles.stepDot, revealed && styles.stepDotDone]}>
            {revealed ? <Check size={12} color={styles.stepCheck.color} /> : <LockKeyhole size={12} color={styles.stepNumber.color} />}
          </View>
          <Text style={[styles.stepText, revealed && styles.stepTextDone]}>{t('recallAnswerLabel')}</Text>
        </View>
      </View>
      {hintCount > 0 ? (
        <View style={styles.revealCard}>
          <Text style={styles.label}>{t('associationHint')}</Text>
          <Text style={styles.body}>{binding?.associationText || t('associationHintMissing')}</Text>
        </View>
      ) : null}
      {revealed ? (
        <View style={styles.answerCard}>
          <Text style={styles.label}>{t('recallAnswerLabel')}</Text>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      ) : null}
      {hintCount < 3 && !feedback ? (
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={actionLabel}
          disabled={disabled} onPress={onHint} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </AnimatedPressable>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.violetLine, backgroundColor: theme.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint },
  icon: { color: theme.violetDeep },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  subtitle: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11 },
  counter: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  steps: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas, borderWidth: 1, borderColor: theme.violetLine },
  stepDotDone: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  stepCheck: { color: theme.onAccent },
  stepNumber: { color: theme.violetDeep },
  stepText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  stepTextDone: { color: theme.violetDeep },
  connector: { flex: 1, height: 2, marginHorizontal: 7, backgroundColor: theme.violetLine },
  connectorDone: { backgroundColor: theme.violetDeep },
  revealCard: { gap: 3, padding: 9, borderRadius: 10, backgroundColor: theme.violetTint },
  answerCard: { gap: 3, padding: 9, borderRadius: 10, backgroundColor: theme.berryTint },
  label: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
  answer: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 16 },
  button: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.violetDeep, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
