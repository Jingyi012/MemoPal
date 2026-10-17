import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import type { NumberPegItem } from '../types/numberPeg.types';
import { getNumberPegStoryHint, maskNumberPegAnswer } from '../utils/numberPegHints';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, Eye, Lightbulb, LockKeyhole } from '@/core/icons';
import { StyleSheet, Text, View } from 'react-native';

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
  card: { gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: theme.berryLine, backgroundColor: theme.paper },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.berryTint },
  icon: { color: theme.berryDeep },
  title: { flex: 1, color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  counter: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  steps: { flexDirection: 'row', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas, borderWidth: 1, borderColor: theme.berryLine },
  stepDotDone: { backgroundColor: theme.berryDeep, borderColor: theme.berryDeep },
  stepCheck: { color: theme.onAccent },
  stepNumber: { color: theme.berryDeep },
  stepText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9 },
  stepTextDone: { color: theme.berryDeep },
  connector: { flex: 1, height: 2, marginHorizontal: 5, backgroundColor: theme.berryLine },
  connectorDone: { backgroundColor: theme.berryDeep },
  section: { gap: 4, padding: 9, borderRadius: 10, backgroundColor: theme.berryTint },
  label: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  mapping: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 16 },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
  caption: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, lineHeight: 16 },
  answer: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 17 },
  button: { minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: theme.berryDeep, paddingHorizontal: 12, paddingVertical: 8 },
  buttonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
