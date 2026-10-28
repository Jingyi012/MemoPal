import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { LearningLoadingView as LoadingView } from '@/features/education/components/LearningUi';
import { EducationPublicResourceCard } from '@/features/education/components/EducationPublicResourceCard';
import { useEducationSavedCourses } from '@/features/education/hooks/useEducationPracticeItems';
import { useEducationCopy } from '@/features/education/i18n';
import { Href, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthProvider';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

export default function EducationSavedCoursesScreen() {
  const copy = useEducationCopy();
  const { styles } = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const courses = useEducationSavedCourses();
  const items = courses.data ?? [];

  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;

  return <View style={styles.page}>
    <CommonHeader title={copy.publicSavedCoursesTitle} description={copy.publicSavedCoursesDescription} backAction={() => router.back()} />
    {courses.isLoading ? <View style={styles.state}><LoadingView description={copy.loading} /></View>
      : courses.isError ? <View style={styles.notice}>
        <Text accessibilityRole="alert" style={styles.body}>{copy.publicSavedCoursesError}</Text>
        <AnimatedPressable accessibilityRole="button" onPress={() => void courses.refetch()} style={styles.action}>
          <Text style={styles.actionText}>{copy.retry}</Text>
        </AnimatedPressable>
      </View>
        : <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => void courses.refetch()} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>{copy.publicSavedCoursesEmpty}</Text>}
          renderItem={({ item }) => <EducationPublicResourceCard
            title={item.title}
            detail={copy.publicCourseAuthor(item.authorDisplayName)}
            metadata={`${copy.publicCourseAssessmentCount(item.assessmentCount)} · ${copy.practiceQuestionCount(item.questionCount)}`}
            onPress={() => router.push(`/community/education/${item.id}` as Href)}
          />}
        />}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  state: { flex: 1, justifyContent: 'center', overflow: 'hidden' },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 16, borderWidth: 1.5, gap: 10, margin: 16, padding: 15 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19 },
  empty: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 15, borderWidth: 1.5, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, padding: 15 },
  separator: { height: 10 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 12 },
}));
