import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import type { NumberPegItem } from '../types/numberPeg.types';
import { getNumberPegStoryHint, maskNumberPegAnswer } from '../utils/numberPegHints';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Eye, Lightbulb, LockKeyhole } from '@/core/icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  item: MemoryItem;
  binding: PegBinding | null;
  peg: NumberPegItem | null;
  hintCount: number;
  feedback: 'correct' | 'wrong' | null;
  disabled: boolean;
  onHint: () => void;
};

export function NumberPegRecallHints({ item, binding, peg, hintCount, feedback, disabled, onHint }: Props) {
  const { t } = useTranslation('numberPeg');
  const { styles } = useStyles();
  const story = binding?.sceneText?.trim() || binding?.sceneRecipe?.caption?.trim() || item.hint?.trim() || '';
  const storyHint = getNumberPegStoryHint(story, item.answer);
  const revealed = hintCount >= 3 || feedback === 'wrong';
  const actionLabel = hintCount === 0 ? t('showNumberShape')
    : hintCount === 1 ? t('showStoryClue') : t('showAnswerAndStory');

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <View style={styles.iconCircle}><Lightbulb size={15} color={styles.icon.color} /></View>
        <Text style={styles.title}>{t('hintTitle')}</Text>
        <Text style={styles.counter}>{hintCount}/3</Text>
      </View>
      <View style={styles.steps}>
        <View style={styles.step}><View style={[styles.stepDot, hintCount >= 1 && styles.stepDotDone]}>
          {hintCount >= 1 ? <Check size={11} color={styles.stepCheck.color} /> : <Eye size={11} color={styles.stepNumber.color} />}
        </View><Text style={[styles.stepText, hintCount >= 1 && styles.stepTextDone]}>{t('numberShapeHint')}</Text></View>
        <View style={[styles.connector, hintCount >= 2 && styles.connectorDone]} />
        <View style={styles.step}><View style={[styles.stepDot, hintCount >= 2 && styles.stepDotDone]}>
          {hintCount >= 2 ? <Check size={11} color={styles.stepCheck.color} /> : <LockKeyhole size={11} color={styles.stepNumber.color} />}
        </View><Text style={[styles.stepText, hintCount >= 2 && styles.stepTextDone]}>{t('savedStoryHint')}</Text></View>
        <View style={[styles.connector, hintCount >= 3 && styles.connectorDone]} />
        <View style={styles.step}><View style={[styles.stepDot, revealed && styles.stepDotDone]}>
          {revealed ? <Check size={11} color={styles.stepCheck.color} /> : <LockKeyhole size={11} color={styles.stepNumber.color} />}
        </View><Text style={[styles.stepText, revealed && styles.stepTextDone]}>{t('recallAnswerLabel')}</Text></View>
      </View>
      {hintCount > 0 && peg ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('numberShapeHint')}</Text>
          <Text style={styles.mapping}>
            {peg.number} → {maskNumberPegAnswer(`${peg.image} ${peg.keyword}`, item.answer)}
          </Text>
          <Text style={styles.body}>{maskNumberPegAnswer(peg.description, item.answer)}</Text>
        </View>
      ) : null}
      {hintCount > 0 && !peg ? <Text style={styles.body}>{t('numberShapeMissing')}</Text> : null}
      {hintCount >= 2 && !revealed ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('savedStoryHint')}</Text>
          <Text style={styles.body}>{storyHint ?? t('storyHintMissing')}</Text>
          {storyHint?.includes('___') ? <Text style={styles.caption}>{t('storyBlankExplanation')}</Text> : null}
        </View>
      ) : null}
      {revealed ? (
        <View style={styles.section}>
          <Text style={styles.label}>{t('recallAnswerLabel')}</Text>
          <Text style={styles.answer}>{item.answer}</Text>
          {story ? <Text style={styles.body}>{story}</Text> : null}
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
  card: { gap: appSpacing.sm, padding: 10, borderRadius: appRadii.control, borderWidth: 1, borderColor: theme.violetLine, backgroundColor: theme.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconCircle: { width: 28, height: 28, borderRadius: appRadii.control, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint },
  icon: { color: theme.violetDeep },
  title: { flex: 1, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  counter: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  steps: { gap: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas, borderWidth: 1, borderColor: theme.violetLine },
  stepDotDone: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  stepCheck: { color: theme.onAccent },
  stepNumber: { color: theme.violetDeep },
  stepText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.caption.fontSize },
  stepTextDone: { color: theme.violetDeep },
  connector: { display: 'none' },
  connectorDone: { backgroundColor: theme.violetDeep },
  section: { gap: appSpacing.xs, padding: 9, borderRadius: 10, backgroundColor: theme.violetTint },
  label: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, textTransform: 'uppercase', letterSpacing: 0.4 },
  mapping: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  caption: { color: theme.inkSoft, fontFamily: typography.body, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  answer: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  button: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.violetDeep, paddingHorizontal: appSpacing.md, paddingVertical: appSpacing.sm },
  buttonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
}));
