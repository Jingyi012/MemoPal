import { Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthProvider';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { LearningArrival, useLearningCopy, useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

/** The companion participates in layout; it can never cover the explanation or CTA. */
export function LearningFeedback({ correct, title, explanation, correctAnswerText, sequence }: { correct: boolean; title: string; explanation?: string | null; correctAnswerText?: string | null; sequence: number }) {
  const { theme } = useLearningStyles();
  const { user } = useAuth();
  const { height } = useWindowDimensions();
  const ui = useLearningCopy();
  return <LearningArrival style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View pointerEvents="none" style={{ width: 58, height: 54, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}><CompanionActor stage={user?.level ?? 1} size={54} cue={{ action: correct ? 'correct' : 'encourage', sequence }} /></View>
      <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: correct ? theme.successText : theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 21, lineHeight: 28 }}>{correct ? '✓ ' : '↻ '}{title}</Text>
    </View>
    {explanation || correctAnswerText ? <ScrollView style={{ maxHeight: Math.max(100, height * .22) }} nestedScrollEnabled showsVerticalScrollIndicator><View style={{ gap: 6, paddingBottom: 2 }}>
      {correctAnswerText ? <Text style={{ color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, lineHeight: 22 }}>{ui.correctAnswer}: {correctAnswerText}</Text> : null}
      {explanation ? <Text style={{ color: theme.ink, fontFamily: typography.bodyBold, fontSize: 14, lineHeight: 22 }}>{explanation}</Text> : null}
    </View></ScrollView> : null}
  </LearningArrival>;
}
