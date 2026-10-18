import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { educationPracticeApi } from '@/features/education/api/educationPractice.api';
import { EducationPracticeReview, isPracticeQuestion } from '@/features/education/components/EducationPracticeReview';
import { EDUCATION_PRACTICE_KEYS, useEducationPublicPracticeAssessment } from '@/features/education/hooks/useEducationPracticeItems';
import { useEducationCopy } from '@/features/education/i18n';
import { useAuth } from '@/contexts/AuthProvider';
import { createEducationQuestionInputLabels } from '@/features/education/utils/createEducationQuestionInputLabels';
import { toAttemptAnswerDto } from '@/features/education/utils/educationAttemptAnswers';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EducationPublicPracticeScreen() {
  const { courseId = '', assessmentId = '' } = useLocalSearchParams<{ courseId: string; assessmentId: string }>();
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const assessment = useEducationPublicPracticeAssessment(courseId, assessmentId);
  const questions = useMemo(() => (assessment.data?.questions ?? [])
    .map(item => item.question)
    .filter(isPracticeQuestion), [assessment.data?.questions]);

  const checkAnswer = async (question: (typeof questions)[number], answer: Parameters<typeof toAttemptAnswerDto>[1]) => {
    const result = await educationPracticeApi.checkPublicPracticeAnswer(
      courseId, assessmentId, question.id, toAttemptAnswerDto(question, answer),
    );
    await queryClient.invalidateQueries({ queryKey: EDUCATION_PRACTICE_KEYS.publicHistory(user?.id ?? 'anonymous') });
    return { isCorrect: result.isCorrect, explanation: result.explanation };
  };

  return <View style={styles.page}>
    <CommonHeader title={assessment.data?.title ?? copy.publicPracticeTitle} backAction={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
      {assessment.isLoading ? <View style={styles.state}><LoadingView description={copy.loading} /></View>
        : assessment.isError || !assessment.data ? <View style={styles.errorState}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.publicPracticeUnavailable}</Text>
          <View style={styles.actions}>
            <AnimatedPressable accessibilityRole="button" onPress={() => void assessment.refetch()} style={styles.action}>
              <Text style={styles.actionText}>{copy.retry}</Text>
            </AnimatedPressable>
            <AnimatedPressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>{copy.publicPracticeReturn}</Text>
            </AnimatedPressable>
          </View>
        </View>
          : <EducationPracticeReview
            attemptId={`public:${courseId}:${assessmentId}`}
            questions={questions}
            labels={createEducationQuestionInputLabels(copy)}
            onCheckAnswer={checkAnswer}
            onExit={() => router.back()}
          />}
    </ScrollView>
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  state: { minHeight: 140, justifyContent: 'center', overflow: 'hidden' },
  errorState: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, gap: 12, padding: 15 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 13, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  actions: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secondaryAction: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetDeep, borderRadius: 13, borderWidth: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  secondaryActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
