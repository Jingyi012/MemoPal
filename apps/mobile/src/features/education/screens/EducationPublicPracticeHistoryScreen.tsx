import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { LearningButton, LearningLoadingView as LoadingView } from '@/features/education/components/LearningUi';
import { useEducationCopy } from '@/features/education/i18n';
import { useClearEducationPublicPracticeHistory, useEducationPublicPracticeHistory } from '@/features/education/hooks/useEducationPracticeItems';
import { EducationPracticeHistoryShareButton } from '@/features/education/components/EducationPracticeHistoryShareButton';
import { Href, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function EducationPublicPracticeHistoryScreen() {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const history = useEducationPublicPracticeHistory();
  const clearHistory = useClearEducationPublicPracticeHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;

  const handleClear = async () => {
    try {
      await clearHistory.mutateAsync();
      setConfirmClear(false);
      Toast.show({ type: 'success', text1: copy.clearPublicPracticeHistoryDone });
    } catch {
      Toast.show({ type: 'error', text1: copy.clearPublicPracticeHistoryError });
    }
  };

  return <View style={styles.page}>
    <CommonHeader showAiCredits={false} title={copy.publicPracticeHistoryTitle} backAction={() => router.back()} />
    {history.isLoading ? <View style={styles.state}><LoadingView description={copy.loading} /></View>
      : history.isError ? <View style={styles.notice}>
        <Text accessibilityRole="alert" style={styles.body}>{copy.publicPracticeHistoryError}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void history.refetch()} style={styles.action}>
          <Text style={styles.actionText}>{copy.retry}</Text>
        </AnimatedPressable>
      </View>
        : <FlatList
          data={history.data ?? []}
          keyExtractor={item => item.questionId}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={history.isRefetching} onRefresh={() => void history.refetch()} />}
          ListHeaderComponent={<View style={styles.share}>
            {history.data?.length ? <Text style={styles.historyNote}>{copy.guidedLessonHistoryNote}</Text> : null}
            {history.data?.length ? <>
              <EducationPracticeHistoryShareButton recentQuestionCount={history.data.length} />

            </> : null}
          </View>}
          ListFooterComponent={history.data?.length ? <View style={{ paddingTop: appSpacing.xxl }}><AnimatedPressable accessibilityRole="button" onPress={() => setConfirmClear(true)} style={styles.clearAction}>
                <Text style={styles.clearText}>{copy.clearPublicPracticeHistory}</Text>
              </AnimatedPressable></View> : null}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<View style={styles.empty}>
            <Ionicons name="footsteps-outline" size={44} color={theme.violetDeep} />
            <Text accessibilityRole="header" style={styles.emptyTitle}>{copy.locale.startsWith('zh') ? '从第一小步开始' : 'Start with one small step'}</Text>
            <Text style={styles.body}>{copy.publicPracticeHistoryEmpty}</Text>
            <LearningButton label={copy.locale.startsWith('zh') ? '探索课程' : 'Explore courses'} onPress={() => router.navigate('/discover' as Href)} />
          </View>}
          renderItem={({ item }) => {
            const date = new Date(item.lastAnsweredAtUtc);
            const formattedDate = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(copy.locale, { dateStyle: 'medium' }).format(date);
            return <View style={styles.card}>
              <Text style={styles.course}>{item.courseTitle}</Text>
              <Text style={styles.assessment}>{item.assessmentTitle} · {item.objectiveTitle}</Text>
              <Text style={styles.prompt}>{item.questionPrompt}</Text>
              <Text style={[styles.result, item.lastAnswerCorrect ? styles.correct : styles.incorrect]}>
                {item.lastAnswerCorrect ? copy.publicPracticeHistoryCorrect : copy.publicPracticeHistoryIncorrect}
              </Text>
              <Text style={styles.date}>{copy.publicPracticeHistoryDate(formattedDate)}</Text>
              <AnimatedPressable accessibilityRole="button" onPress={() => router.push(`/community/education/${item.courseId}/${item.assessmentId}` as Href)} style={styles.action}>
                <Text style={styles.actionText}>{copy.publicPracticeHistoryOpen}</Text>
              </AnimatedPressable>
            </View>;
          }}
        />}
    <ConfirmModal
      visible={confirmClear}
      title={copy.clearPublicPracticeHistoryTitle}
      description={copy.clearPublicPracticeHistoryDescription}
      confirmText={copy.clearPublicPracticeHistoryConfirm}
      cancelText={copy.cancel}
      destructive
      isLoading={clearHistory.isPending}
      onConfirm={() => void handleClear()}
      onCancel={() => setConfirmClear(false)}
    />
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { padding: appSpacing.lg, paddingBottom: appSpacing.section },
  share: { gap: 10, paddingBottom: 14 },
  historyNote: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: appRadii.control, borderWidth: 1, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight, padding: appSpacing.md },
  state: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1.5, gap: 10, margin: appSpacing.lg, padding: 15 },
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 5, gap: appSpacing.md, padding: 18 },
  course: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  assessment: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  prompt: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  result: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  correct: { color: theme.successText },
  incorrect: { color: theme.berryDeep },
  date: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  empty: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 5, gap: appSpacing.lg, padding: appSpacing.xl },
  emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight },
  separator: { height: 10 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, borderBottomWidth: 4, borderColor: theme.primaryShadow, paddingVertical: 10, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  clearAction: { alignItems: 'center', alignSelf: 'flex-start', borderColor: theme.berryLine, borderRadius: appRadii.control, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  clearText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
}));
