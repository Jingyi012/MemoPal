import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, X } from '@/core/icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';

export type RecallFeedback = 'correct' | 'wrong' | null;

const CONFETTI_PIECES = [
  { x: -92, y: -48, rotation: -260, size: 7 },
  { x: -72, y: -76, rotation: 210, size: 8 },
  { x: -52, y: -35, rotation: -180, size: 6 },
  { x: -31, y: -88, rotation: 300, size: 7 },
  { x: -12, y: -54, rotation: -220, size: 8 },
  { x: 13, y: -78, rotation: 250, size: 6 },
  { x: 34, y: -42, rotation: -310, size: 8 },
  { x: 55, y: -91, rotation: 180, size: 7 },
  { x: 77, y: -58, rotation: -240, size: 6 },
  { x: 96, y: -30, rotation: 320, size: 8 },
  { x: -83, y: 12, rotation: 220, size: 6 },
  { x: -42, y: 22, rotation: -280, size: 8 },
  { x: 42, y: 20, rotation: 260, size: 7 },
  { x: 84, y: 10, rotation: -200, size: 6 },
] as const;

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
  answerPlaceholder = 'Type your answer',
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
  const reduceMotion = useReducedMotion();
  const confettiProgress = useRef(new Animated.Value(0)).current;
  const previousFeedback = useRef<RecallFeedback>(feedback);

  useEffect(() => {
    const wasAlreadyCorrect = previousFeedback.current === 'correct';
    previousFeedback.current = feedback;
    confettiProgress.stopAnimation();
    confettiProgress.setValue(0);

    if (feedback !== 'correct' || wasAlreadyCorrect || reduceMotion) return;

    Animated.timing(confettiProgress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [confettiProgress, feedback, reduceMotion]);

  const confettiColors = [theme.berry, theme.sun, theme.violetDeep, theme.grass, theme.berryDeep];

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]}>
      {feedback === 'correct' ? (
        <View pointerEvents="none" style={styles.confettiLayer}>
          {CONFETTI_PIECES.map((piece, index) => {
            const opacity = confettiProgress.interpolate({
              inputRange: [0, 0.12, 0.78, 1],
              outputRange: [0, 1, 0.8, 0],
            });
            const translateX = confettiProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, piece.x],
            });
            const translateY = confettiProgress.interpolate({
              inputRange: [0, 0.65, 1],
              outputRange: [0, piece.y, piece.y + 32],
            });
            const rotate = confettiProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${piece.rotation}deg`],
            });

            return (
              <Animated.View
                key={`${piece.x}-${piece.y}`}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: confettiColors[index % confettiColors.length],
                    height: piece.size,
                    marginLeft: -piece.size / 2,
                    opacity,
                    transform: [{ translateX }, { translateY }, { rotate }],
                    width: piece.size * 0.65,
                  },
                ]}
              />
            );
          })}
        </View>
      ) : null}
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
        autoCapitalize="none"
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
        <AppButton disabled={actionDisabled || (!answer.trim() && !feedback)} fullWidth label={actionLabel} onPress={onSubmit} pressOnIn size="large" />
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
  card: { position: 'relative', borderRadius: 24, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  palaceCard: { borderColor: theme.violetLine },
  confettiLayer: { position: 'absolute', top: 14, left: 0, right: 0, height: 130, zIndex: 2, elevation: 2 },
  confettiPiece: { position: 'absolute', top: 18, left: '50%', borderRadius: 2 },
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
  skipButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, textAlign: 'center', marginTop: 15 },
}));
