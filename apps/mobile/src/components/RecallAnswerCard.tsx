import AnimatedPressable from '@/components/AnimatedPressable';
import { CompanionLearningPresence } from '@/features/profile/companion/CompanionLearningPresence';
import { AppButton } from '@/components/ui/AppButton';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Check, X } from '@/core/icons';
import { useReducedMotion } from 'react-native-reanimated';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

export type RecallFeedback = 'correct' | 'wrong' | null;

const PEG_CONFETTI_PIECES = [
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

const PALACE_CONFETTI_PIECES = [
  { x: -136, y: -58, rotation: -260, size: 8 },
  { x: -120, y: -94, rotation: 210, size: 9 },
  { x: -105, y: -24, rotation: -180, size: 7 },
  { x: -92, y: -112, rotation: 300, size: 8 },
  { x: -78, y: -68, rotation: -220, size: 9 },
  { x: -64, y: -132, rotation: 250, size: 7 },
  { x: -50, y: -38, rotation: -310, size: 9 },
  { x: -36, y: -104, rotation: 180, size: 8 },
  { x: -22, y: -82, rotation: -240, size: 7 },
  { x: -8, y: -144, rotation: 320, size: 9 },
  { x: 8, y: -60, rotation: 220, size: 7 },
  { x: 22, y: -118, rotation: -280, size: 9 },
  { x: 36, y: -42, rotation: 260, size: 8 },
  { x: 50, y: -138, rotation: -200, size: 7 },
  { x: 64, y: -72, rotation: 230, size: 9 },
  { x: 78, y: -110, rotation: -310, size: 8 },
  { x: 92, y: -34, rotation: 180, size: 7 },
  { x: 106, y: -126, rotation: -240, size: 9 },
  { x: 120, y: -66, rotation: 320, size: 8 },
  { x: 136, y: -98, rotation: -200, size: 7 },
  { x: -116, y: 26, rotation: 200, size: 8 },
  { x: -58, y: 38, rotation: -280, size: 7 },
  { x: 58, y: 34, rotation: 260, size: 9 },
  { x: 116, y: 20, rotation: -200, size: 7 },
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
  assistance?: ReactNode;
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
  assistance,
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
  const accent = theme.violetDeep;
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
  const renderConfetti = (
    pieces: readonly { x: number; y: number; rotation: number; size: number }[],
    layerStyle: StyleProp<ViewStyle>,
    pieceStyle: StyleProp<ViewStyle>,
  ) => (
    <View pointerEvents="none" style={layerStyle}>
      {pieces.map((piece, index) => {
        const opacity = confettiProgress.interpolate({
          inputRange: [0, 0.1, 0.75, 1],
          outputRange: [0, 1, 0.85, 0],
        });
        const translateX = confettiProgress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] });
        const translateY = confettiProgress.interpolate({
          inputRange: [0, 0.65, 1],
          outputRange: [0, piece.y, piece.y + 42],
        });
        const rotate = confettiProgress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.rotation}deg`] });

        return (
          <Animated.View
            key={`${piece.x}-${piece.y}`}
            style={[
              styles.confettiPiece,
              pieceStyle,
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
  );

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]}>
      {isPeg && feedback === 'correct'
        ? renderConfetti(PEG_CONFETTI_PIECES, styles.confettiLayer, styles.confettiPiece)
        : null}
      <View style={styles.identityRow}>
        <View style={styles.identityCopy}>
          {icon ? <View style={[styles.icon, isPeg ? styles.pegIcon : styles.palaceIcon]}>{icon}</View> : null}
          <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
        </View>
        <View style={styles.companionSlot}><CompanionLearningPresence state={feedback ?? 'thinking'} corner /></View>
      </View>
      <Text style={[styles.prompt, !isPeg && styles.palacePrompt]}>{prompt}</Text>
      {cue ? <View style={[styles.cue, !isPeg && styles.palaceCue]}>{cue}</View> : null}
      <View
        ref={inputAreaRef}
        collapsable={false}
        style={[{ alignSelf: 'stretch' }, !isPeg && styles.palaceFieldWrap]}>
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
        placeholderTextColor={!isPeg ? theme.inkMuted : theme.inkSoft}
        selectionColor={accent}
        cursorColor={accent}
        style={[
          styles.answerInput,
          !isPeg && styles.palaceInput,
          !isPeg && feedback && styles.palaceInputWithFeedback,
          feedback === 'correct' && styles.correctInput,
          feedback === 'wrong' && styles.wrongInput,
        ]}
      />
      {!isPeg && feedback ? (
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={feedbackText}
          accessibilityLiveRegion="polite"
          style={[
            styles.palaceFieldFeedback,
            feedback === 'correct' ? styles.palaceFieldFeedbackCorrect : styles.palaceFieldFeedbackWrong,
          ]}>
          {feedback === 'correct'
            ? <Check size={17} color={theme.successText} />
            : <X size={17} color={theme.berryDeep} />}
        </View>
      ) : null}
      {!isPeg && feedback === 'correct'
        ? renderConfetti(PALACE_CONFETTI_PIECES, styles.palaceConfettiLayer, styles.palaceConfettiPiece)
        : null}
      </View>
      {assistance}
      {!isPeg && feedback === 'wrong' ? (
        <Text style={styles.palaceCorrection} accessibilityLiveRegion="polite">{feedbackText}</Text>
      ) : null}
      {isPeg && feedback ? (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          {feedback === 'correct' ? <Check size={18} color={theme.successText} /> : <X size={18} color={theme.berryDeep} />}
          <Text style={[styles.feedbackText, { color: feedback === 'correct' ? theme.successText : theme.berryDeep }]}>
            {feedbackText}
          </Text>
        </View>
      ) : null}
      <View ref={actionAreaRef} style={[styles.actionButtonWrap, !isPeg && styles.palaceAction]}>
        <AppButton disabled={actionDisabled || (!answer.trim() && !feedback)} fullWidth label={actionLabel} onPress={onSubmit} pressOnIn size="large" />
      </View>
      {!feedback && onSkip && skipLabel ? (
        <AnimatedPressable accessibilityRole="button" disabled={actionDisabled} onPress={onSkip} style={styles.skipButton}>
          <Text style={[styles.progress, !isPeg && styles.palaceSkipText]}>{skipLabel}</Text>
        </AnimatedPressable>
      ) : null}
      <Text style={[styles.progress, !isPeg && styles.palaceProgress]}>{progressLabel}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { position: 'relative', borderRadius: 24, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  identityRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 8 },
  identityCopy: { flex: 1, minWidth: 0, gap: 4 },
  companionSlot: { width: 116, height: 110, position: 'relative' },
  palaceCard: {
    borderColor: theme.violetLine,
    borderWidth: 0,
    borderRadius: 24,
    padding: 20,
  },
  confettiLayer: { position: 'absolute', top: 14, left: 0, right: 0, height: 130, zIndex: 2, elevation: 2 },
  confettiPiece: { position: 'absolute', top: 18, left: '50%', borderRadius: 2 },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pegIcon: { backgroundColor: theme.violetTint },
  palaceIcon: { backgroundColor: theme.violetTint },
  eyebrow: { fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18 },
  prompt: { color: theme.ink, fontFamily: typography.display, fontSize: 20, lineHeight: 28, textAlign: 'center', marginTop: 12, marginBottom: 18 },
  palacePrompt: { fontSize: 21, lineHeight: 28, marginTop: 8, marginBottom: 20, width: '100%' },
  cue: { alignSelf: 'stretch', marginBottom: 18 },
  palaceCue: { marginBottom: 20 },
  palaceInput: { borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, fontSize: 15, letterSpacing: 0, textAlign: 'left', minHeight: 56, paddingHorizontal: 16 },
  palaceAction: { marginTop: 12 },
  palaceSkipText: { marginTop: 0, fontSize: 12 },
  palaceProgress: { marginTop: 8, fontSize: 11, color: theme.inkSoft },
  answerInput: { width: '100%', minHeight: 54, borderRadius: 14, borderWidth: 2.5, borderColor: theme.line, backgroundColor: theme.paper, paddingHorizontal: 13, color: theme.ink, textAlign: 'center', fontFamily: typography.bodyExtraBold, fontSize: 16, letterSpacing: 1 },
  correctInput: { borderColor: theme.grass, backgroundColor: theme.mintTint },
  wrongInput: { borderColor: theme.berry, backgroundColor: theme.berryTint },
  feedback: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: 7, marginTop: 12 },
  palaceFieldWrap: { position: 'relative' },
  palaceInputWithFeedback: { paddingRight: 52 },
  palaceFieldFeedback: { position: 'absolute', right: 12, top: '50%', width: 30, height: 30, marginTop: -15, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: theme.paper },
  palaceFieldFeedbackCorrect: { borderWidth: 1, borderColor: theme.mintLine },
  palaceFieldFeedbackWrong: { borderWidth: 1, borderColor: theme.berryLine },
  palaceConfettiLayer: { position: 'absolute', top: -72, left: 0, right: 0, height: 150, zIndex: 2, elevation: 2, overflow: 'visible' },
  palaceConfettiPiece: { top: 92 },
  palaceCorrection: { alignSelf: 'stretch', marginTop: 8, color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18 },
  feedbackText: { flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  actionButtonWrap: { alignSelf: 'stretch', marginTop: 18 },
  skipButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  progress: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12, textAlign: 'center', marginTop: 15 },
}));
