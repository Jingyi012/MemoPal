import AnimatedPressable from '@/components/AnimatedPressable';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
  scoreLabel: string;
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
  scoreLabel,
  onAnswerChange,
  onSubmit,
}: RecallAnswerCardProps) {
  const isPeg = tone === 'peg';
  const accent = isPeg ? theme.berryDeep : theme.violetDeep;

  return (
    <View style={[styles.card, !isPeg && styles.palaceCard]}>
      <View style={[styles.icon, isPeg ? styles.pegIcon : styles.palaceIcon]}>{icon}</View>
      <Text style={[styles.eyebrow, { color: accent }]}>{eyebrow}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        value={answer}
        onChangeText={(value) => { if (!feedback) onAnswerChange(value); }}
        onSubmitEditing={onSubmit}
        editable={!feedback}
        accessibilityLabel="Type your answer"
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="TYPE YOUR ANSWER"
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
      <AnimatedPressable
        disabled={!answer.trim() && !feedback}
        onPress={onSubmit}
        style={[styles.actionButton, !answer.trim() && !feedback && styles.disabledButton]}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </AnimatedPressable>
      <Text style={styles.score}>{scoreLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 22, alignItems: 'center' },
  palaceCard: { borderColor: '#DCD4FF' },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pegIcon: { backgroundColor: '#FFF0F4' },
  palaceIcon: { backgroundColor: '#EEE9FF' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  prompt: { color: theme.ink, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 12, marginBottom: 16 },
  answerInput: { width: '100%', minHeight: 54, borderRadius: 14, borderWidth: 2.5, borderColor: theme.line, backgroundColor: 'white', paddingHorizontal: 13, color: theme.ink, textAlign: 'center', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  correctInput: { borderColor: theme.grass, backgroundColor: '#F1FBF5' },
  wrongInput: { borderColor: theme.berry, backgroundColor: '#FFF1F4' },
  feedback: { marginTop: 12, flexDirection: 'row', gap: 7, alignItems: 'center' },
  feedbackText: { flexShrink: 1, fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
  actionButton: { width: '100%', minHeight: 48, borderRadius: 14, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  actionText: { color: 'white', fontSize: 14, fontWeight: '900' },
  disabledButton: { opacity: 0.4 },
  score: { color: theme.inkSoft, fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 15 },
});
