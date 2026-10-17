import AnimatedPressable from '@/components/AnimatedPressable';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, X } from '@/core/icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export type RecallFeedback = 'correct' | 'wrong' | null;

type RecallAnswerCardProps = {
  tone: 'peg' | 'palace';
  icon?: ReactNode;
  eyebrow: string;
  prompt: string;
  answer: string;
  feedback: RecallFeedback;
  feedbackText: string;
  actionLabel: string;
  actionDisabled?: boolean;
  progressLabel: string;
  cue?: ReactNode;
  answerAccessibilityLabel?: string;
  answerPlaceholder?: string;
  onAnswerFocus?: () => void;
  inputRef?: { current: TextInput | null };
  inputAreaRef?: (view: View | null) => void;
  actionAreaRef?: (view: View | null) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  skipLabel?: string;
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
  answerAccessibilityLabel = 'Type your answer',
  answerPlaceholder = 'TYPE YOUR ANSWER',
  onAnswerFocus,
  actionAreaRef,
  inputAreaRef,
  inputRef,
  onAnswerChange,
  onSubmit,
  onSkip,
  skipLabel,
}: RecallAnswerCardProps) {
  const { styles, theme } = useStyles();
  const isPeg = tone === 'peg';
  const accent = isPeg ? theme.berryDeep : theme.violetDeep;

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]}>
      {icon ? <View style={[styles.icon, isPeg ? styles.pegIcon : styles.palaceIcon]}>{icon}</View> : null}
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      {cue ? <View style={styles.cue}>{cue}</View> : null}
      <View ref={inputAreaRef} collapsable={false} style={{ alignSelf: 'stretch' }}>
      <TextInput
        ref={inputRef}
        value={answer}
        onChangeText={onAnswerChange}
        onSubmitEditing={onSubmit}
        returnKeyType={feedback ? 'next' : 'done'}
        submitBehavior="submit"
        // Keep keyboard focus while feedback is shown. Callers ignore edits
        // until advancing so a retry happens later with the answer hidden.
        editable
        caretHidden={feedback !== null}
        onFocus={onAnswerFocus}
        accessibilityLabel={answerAccessibilityLabel}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={answerPlaceholder}
        placeholderTextColor={theme.inkSoft}
        selectionColor={accent}
        cursorColor={accent}
        style={[
          styles.answerInput,
          feedback === 'correct' && styles.correctInput,
          feedback === 'wrong' && styles.wrongInput,
        ]}
      />
      </View>
      {feedback ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          {feedback === 'correct' ? <Check size={18} color={theme.successText} /> : <X size={18} color={theme.berryDeep} />}
          <Text style={[styles.feedbackText, { color: feedback === 'correct' ? theme.successText : theme.berryDeep }]}>
            {feedbackText}
          </Text>
        </View>
      ) : null}
      <View ref={actionAreaRef} style={styles.actionButtonWrap}>
        <AnimatedPressable
          disabled={actionDisabled || (!answer.trim() && !feedback)}
          pressOnIn
          onPress={onSubmit}
          style={[styles.actionButton, (actionDisabled || (!answer.trim() && !feedback)) && styles.disabledButton]}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </AnimatedPressable>
      </View>
      {!feedback && onSkip && skipLabel ? (
        <AnimatedPressable accessibilityRole="button" disabled={actionDisabled} onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.progress}>{skipLabel}</Text>
        </AnimatedPressable>
      ) : null}
      <Text style={styles.progress}>{progressLabel}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  palaceCard: { borderColor: theme.violetLine },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pegIcon: { backgroundColor: theme.berryTint },
  palaceIcon: { backgroundColor: theme.violetTint },
  eyebrow: { fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  prompt: { color: theme.ink, fontFamily: typography.display, fontSize: 20, lineHeight: 28, textAlign: 'center', marginTop: 12, marginBottom: 18 },
  cue: { alignSelf: 'stretch', marginBottom: 18 },
  answerInput: { width: '100%', minHeight: 54, borderRadius: 14, borderWidth: 2.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13, color: theme.ink, textAlign: 'center', fontFamily: typography.bodyExtraBold, fontSize: 16, letterSpacing: 1 },
  correctInput: { borderColor: theme.grass, backgroundColor: theme.mintTint },
  wrongInput: { borderColor: theme.berry, backgroundColor: theme.berryTint },
  feedback: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: 7, marginTop: 12 },
  feedbackText: { flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actionButtonWrap: { alignSelf: 'stretch', marginTop: 18 },
  actionButton: { width: '100%', minHeight: 48, borderRadius: 14, backgroundColor: theme.night, borderWidth: 1.5, borderColor: theme.violetLine, paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 14 },
  disabledButton: { opacity: 0.4 },
  skipButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, textAlign: 'center', marginTop: 15 },
}));
