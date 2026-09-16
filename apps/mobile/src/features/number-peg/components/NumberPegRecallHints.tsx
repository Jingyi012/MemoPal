import AnimatedPressable from '@/components/AnimatedPressable';
import { useTranslation } from '@/core/i18n/useTranslation';
import type { MemoryItem, PegBinding } from '@/features/memory-sets';
import type { NumberPegItem } from '../types/numberPeg.types';
import { getNumberPegStoryHint, maskNumberPegAnswer } from '../utils/numberPegHints';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
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
    <View style={styles.container} accessibilityLiveRegion="polite">
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
  container: { gap: 10 },
  section: { gap: 5, padding: 12, borderRadius: 12, backgroundColor: theme.berryTint },
  label: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  mapping: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 17 },
  body: { color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20 },
  caption: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  answer: { color: theme.successText, fontFamily: typography.bodyExtraBold, fontSize: 18 },
  button: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', borderRadius: 12,
    backgroundColor: theme.berryTint, paddingHorizontal: 14, paddingVertical: 10 },
  buttonText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
