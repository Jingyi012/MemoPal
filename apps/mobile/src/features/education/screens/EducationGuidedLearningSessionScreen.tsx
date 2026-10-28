import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import { useReducedMotion } from 'react-native-reanimated';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { LearningThemeContext, LearningSkeleton, learningThemeFor } from '../components/LearningUi';
import { Ionicons } from '@expo/vector-icons';
import { EducationGuidedLearningPlayer } from '@/features/education/components/EducationGuidedLearningPlayer';
import { EDUCATION_PRACTICE_KEYS, useEducationGuidedSession } from '@/features/education/hooks/useEducationPracticeItems';
import { useEducationCopy } from '@/features/education/i18n';
import { useAuth } from '@/contexts/AuthProvider';
import { useQueryClient } from '@tanstack/react-query';
import { Stack, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

export default function EducationGuidedLearningSessionScreen() {
  const { sessionId = '', classroomId } = useLocalSearchParams<{ sessionId: string; classroomId?: string }>();
  const copy = useEducationCopy();
  const reduceMotion = useReducedMotion();
  const { styles, theme } = useStyles();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const identity = `${user?.id ?? 'anonymous'}:${classroomId ?? 'public'}:${sessionId}`;
  const [unavailableFor, setUnavailableFor] = useState('');
  const unavailable = unavailableFor === identity;
  const session = useEducationGuidedSession(sessionId, !unavailable, classroomId);

  useEffect(() => {
    const status = (session.error as { response?: { status?: number } } | null)?.response?.status;
    if (status === 403 || status === 404) {
      setUnavailableFor(identity);
      queryClient.removeQueries({ queryKey: EDUCATION_PRACTICE_KEYS.guidedSession(user?.id ?? 'anonymous', sessionId, classroomId), exact: true });
    }
  }, [classroomId, identity, queryClient, session.error, sessionId, user?.id]);

  if (user?.accountMode === 'RestrictedLearner' && !classroomId) return <Redirect href="/education/assignments" />;

  const showSessionPlayer = !!session.data && !session.isLoading && !session.isError && !unavailable && !!user?.id;
  return <LearningThemeContext.Provider value={learningThemeFor(session.data?.courseTitle ?? '', theme)}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Stack.Screen options={{ animation: reduceMotion ? 'none' : 'fade_from_bottom' }} />
    {!showSessionPlayer ? <CommonHeader compact showAiCredits={false} title={session.data?.assessmentTitle ?? copy.publicPracticeTitle} leftComponent={<AnimatedPressable accessibilityLabel={copy.publicPracticeReturn} onPress={() => router.back()} style={{ minHeight: 44, width: 44, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="close" size={26} color={theme.ink} /></AnimatedPressable>} /> : null}
    <View style={{ flex: 1 }}>
      {session.isLoading ? <View style={styles.content}><LearningSkeleton /></View>
        : unavailable || !user?.id ? <View style={styles.errorState}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.guidedLessonUnavailable}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => router.back()} style={styles.action}><Text style={styles.actionText}>{copy.publicPracticeReturn}</Text></AnimatedPressable>
        </View>
          : session.isError || !session.data ? <View style={styles.errorState}>
            <Text accessibilityRole="alert" style={styles.body}>{copy.guidedLessonSessionError}</Text>
            <AnimatedPressable accessibilityRole="button" onPress={() => void session.refetch()} style={styles.action}><Text style={styles.actionText}>{copy.retry}</Text></AnimatedPressable>
            <AnimatedPressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{copy.publicPracticeReturn}</Text></AnimatedPressable>
          </View>
            : <EducationGuidedLearningPlayer key={`${user.id}:${classroomId ?? 'public'}:${session.data.sessionId}`} session={session.data} userId={user.id} classroomId={classroomId}
              onExit={() => router.back()} onUnavailable={() => setUnavailableFor(identity)} />}
    </View>
  </KeyboardAvoidingView></LearningThemeContext.Provider>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  state: { minHeight: 140, justifyContent: 'center', overflow: 'hidden' },
  errorState: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 16, borderWidth: 1.5, gap: 10, padding: 15 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 13, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  secondaryAction: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.violetDeep, borderRadius: 13, borderWidth: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 },
  secondaryActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
