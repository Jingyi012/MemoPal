import AnimatedPressable from '@/components/AnimatedPressable';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

export type RecallFeedback = 'correct' | 'wrong' | null;

type RecallAnswerCardProps = {
  tone: 'peg' | 'palace';
  icon: ReactNode;
  eyebrow: string;
  prompt: string;
  answer: string;
  feedback: RecallFeedback;
  feedbackText: string;
  actionLabel: string;
  actionDisabled?: boolean;
  progressLabel: string;
  cue?: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  onAnswerLayout?: (event: LayoutChangeEvent) => void;
  answerAccessibilityLabel?: string;
  answerPlaceholder?: string;
  onAnswerFocus?: () => void;
  useBottomSheetInput?: boolean;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
};

/** Shared recall interaction surface used by both technique players. */
export function RecallAnswerCard({
  tone,
  icon,
  eyebrow,
  prompt,
  answer,
  feedback,
  feedbackText,
  actionLabel,
  actionDisabled = false,
  progressLabel,
  cue,
  onLayout,
  onAnswerLayout,
  answerAccessibilityLabel = 'Type your answer',
  answerPlaceholder = 'TYPE YOUR ANSWER',
  onAnswerFocus,
  useBottomSheetInput = false,
  onAnswerChange,
  onSubmit,
}: RecallAnswerCardProps) {
  const isPeg = tone === 'peg';
  const accent = isPeg ? theme.berryDeep : theme.violetDeep;
  const AnswerInput = useBottomSheetInput ? BottomSheetTextInput : TextInput;

  return (
    <View onLayout={onLayout} style={[styles.card, !isPeg && styles.palaceCard]}>
      <View style={[styles.icon, isPeg ? styles.pegIcon : styles.palaceIcon]}>{icon}</View>
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      {cue ? <View style={styles.cue}>{cue}</View> : null}
      <AnswerInput
        value={answer}
        onChangeText={(value) => { if (!feedback) onAnswerChange(value); }}
        onSubmitEditing={onSubmit}
        editable={!feedback}
        accessibilityLabel={answerAccessibilityLabel}
        autoCapitalize="characters"
        autoCorrect={false}
        onFocus={onAnswerFocus}
        onLayout={onAnswerLayout}
        placeholder={answerPlaceholder}
        placeholderTextColor="#AAA7B5"
        style={[
          styles.answerInput,
          feedback === 'correct' && styles.correctInput,
          feedback === 'wrong' && styles.wrongInput,
        ]}
      />
      {feedback ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          {feedback === 'correct' ? <Check size={18} color={theme.grass} /> : <X size={18} color={theme.berryDeep} />}
          <Text style={[styles.feedbackText, { color: feedback === 'correct' ? theme.grass : theme.berryDeep }]}>
            {feedbackText}
          </Text>
        </View>
      ) : null}
      <View style={styles.actionButtonWrap}>
        <AnimatedPressable
          disabled={actionDisabled || (!answer.trim() && !feedback)}
          onPress={onSubmit}
          style={[styles.actionButton, (actionDisabled || (!answer.trim() && !feedback)) && styles.disabledButton]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </AnimatedPressable>
      </View>
      <Text style={styles.progress}>{progressLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  palaceCard: { borderColor: '#DCD4FF' },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  eyebrow: { fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  prompt: { color: theme.ink, fontFamily: typography.display, fontSize: 20, textAlign: 'center', marginTop: 12, marginBottom: 16 },
  cue: { alignSelf: 'stretch', marginBottom: 14 },
  answerInput: { width: '100%', minHeight: 54, borderRadius: 14, borderWidth: 2.5, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 13, color: theme.ink, textAlign: 'center', fontFamily: typography.bodyExtraBold, fontSize: 16, letterSpacing: 1 },
  correctInput: { borderColor: theme.grass, backgroundColor: '#F1FBF5' },
  wrongInput: { borderColor: theme.berry, backgroundColor: '#FFF1F4' },
  feedback: { marginTop: 12, flexDirection: 'row', gap: 7, alignItems: 'center' },
  feedbackText: { flexShrink: 1, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actionButtonWrap: { alignSelf: 'stretch', marginTop: 16 },
  actionButton: { width: '100%', minHeight: 48, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabledButton: { opacity: 0.4 },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, textAlign: 'center', marginTop: 15 },
});
