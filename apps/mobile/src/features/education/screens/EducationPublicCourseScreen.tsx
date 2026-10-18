import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useEducationCopy } from '@/features/education/i18n';
import { EducationPublicResourceCard } from '@/features/education/components/EducationPublicResourceCard';
import { useEducationPublicCourse, useEducationPublicCourseSave, useReportEducationCourse } from '@/features/education/hooks/useEducationPracticeItems';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import * as Linking from 'expo-linking';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Flag } from '@/core/icons';
import { Share, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

export default function EducationPublicCourseScreen() {
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const router = useRouter();
  const course = useEducationPublicCourse(courseId);
  const saveCourse = useEducationPublicCourseSave(courseId);
  const reportCourse = useReportEducationCourse();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');

  return <View style={styles.page}>
    <CommonHeader title={course.data?.title ?? copy.publicCourseDetailTitle} backAction={() => router.back()} />
    <ScrollView contentContainerStyle={styles.content}>
      {course.isLoading ? <View style={styles.state}><LoadingView description={copy.loading} /></View>
        : course.isError || !course.data ? <View style={styles.errorState}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.publicCoursesError}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => void course.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </AnimatedPressable>
        </View>
          : <>
            <Text style={styles.author}>{copy.publicCourseAuthor(course.data.authorDisplayName)}</Text>
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => {
                const url = Linking.createURL(`community/education/${encodeURIComponent(course.data!.id)}`);
                void Share.share({ message: `${course.data!.title}\n${copy.sharePublicCourseOpenLink}: ${url}`, title: copy.sharePublicCourseTitle })
                  .catch(() => Toast.show({ type: 'error', text1: copy.sharePublicCourseError }));
              }}
              style={styles.shareButton}
            >
              <Text style={styles.saveButtonText}>{copy.sharePublicCourse}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityState={{ disabled: saveCourse.isPending }}
              disabled={saveCourse.isPending}
              onPress={() => saveCourse.mutate(!course.data?.isSaved)}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{course.data.isSaved ? copy.unsavePublicCourse : copy.savePublicCourse}</Text>
            </AnimatedPressable>
            {saveCourse.isError && <Text accessibilityRole="alert" style={styles.saveError}>{copy.savePublicCourseError}</Text>}
            {course.data.isSaved && <Text style={styles.savedNote}>{copy.publicCourseSaved}</Text>}
            <AnimatedPressable accessibilityRole="button" onPress={() => setReportOpen(true)} style={styles.reportButton}>
              <Flag size={15} color={theme.inkSoft} />
              <Text style={styles.reportText}>{copy.reportPublicCourse}</Text>
            </AnimatedPressable>
            <Text style={styles.notice}>{copy.publicCoursePracticeNote}</Text>
            {course.data.objectives.length > 0 && <>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{copy.publicCourseObjectives}</Text>
              <Text style={styles.body}>{copy.publicCourseMemoryBridgeNote}</Text>
              {course.data.objectives.map(objective => <View key={objective.id} style={styles.objective}>
                <Text style={styles.objectiveTitle}>{objective.title}</Text>
                {objective.recommendedMemorySet && <EducationPublicResourceCard
                  title={objective.recommendedMemorySet.title}
                  detail={objective.recommendedMemorySet.description ?? copy.publicCourseMemoryPractice}
                  metadata={objective.recommendedMemorySet.techniqueKey === 'palace' ? copy.memoryTechniquePalace : copy.memoryTechniquePeg}
                  onPress={() => router.push(`/community/memory-sets/${objective.recommendedMemorySet!.id}` as Href)}
                />}
              </View>)}
            </>}
            <Text accessibilityRole="header" style={styles.sectionTitle}>{copy.publicCourseAssessmentCount(course.data.assessments.length)}</Text>
            {course.data.assessments.length ? course.data.assessments.map(assessment => (
              <EducationPublicResourceCard
                key={assessment.id}
                title={assessment.title}
                detail={copy.practiceQuestionCount(assessment.questionCount)}
                metadata={assessment.questionTypes.map(type => copy.questionTypeLabels[type]).join(' · ')}
                onPress={() => router.push(`/community/education/${courseId}/${assessment.id}` as Href)}
              />
            )) : <Text style={styles.body}>{copy.publicCourseNoAssessments}</Text>}
          </>}
    </ScrollView>
    {course.data ? <ConfirmModal
      visible={reportOpen}
      icon={<Flag size={25} color={theme.berryDeep} />}
      title={copy.reportPublicCourseTitle}
      subject={course.data.title}
      description={copy.reportPublicCourseDescription}
      confirmText={copy.reportPublicCourseConfirm}
      cancelText={copy.cancel}
      isLoading={reportCourse.isPending}
      onCancel={() => setReportOpen(false)}
      onConfirm={() => reportCourse.mutate({ courseId, reason: reportReason, details: reportDetails.trim() || undefined }, {
        onSuccess: () => {
          setReportOpen(false);
          setReportDetails('');
          Toast.show({ type: 'success', text1: copy.reportPublicCourseThanks });
        },
        onError: () => Toast.show({ type: 'error', text1: copy.reportPublicCourseError }),
      })}
    >
      <View style={styles.reportReasons}>
        {([
          ['incorrect', copy.reportPublicCourseReasonIncorrect],
          ['inappropriate', copy.reportPublicCourseReasonInappropriate],
          ['personal-info', copy.reportPublicCourseReasonPrivacy],
          ['copyright', copy.reportPublicCourseReasonCopyright],
          ['spam', copy.reportPublicCourseReasonSpam],
          ['other', copy.reportPublicCourseReasonOther],
        ] as const).map(([reason, label]) => <AnimatedPressable
          key={reason}
          accessibilityRole="radio"
          accessibilityState={{ checked: reportReason === reason }}
          onPress={() => setReportReason(reason)}
          style={[styles.reportReason, reportReason === reason && styles.reportReasonSelected]}
        ><Text style={[styles.reportReasonText, reportReason === reason && styles.reportReasonTextSelected]}>{label}</Text></AnimatedPressable>)}
        <TextInput
          accessibilityLabel={copy.reportPublicCourseDetails}
          value={reportDetails}
          onChangeText={value => setReportDetails(value.slice(0, 500))}
          placeholder={copy.reportPublicCourseDetails}
          placeholderTextColor={theme.inkSoft}
          multiline
          maxLength={500}
          style={styles.reportDetailsInput}
        />
      </View>
    </ConfirmModal> : null}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 12, padding: 18, paddingBottom: 36 },
  state: { minHeight: 120, justifyContent: 'center', overflow: 'hidden' },
  author: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  saveButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.violetDeep, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  shareButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  saveButtonText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  reportButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, paddingHorizontal: 5 },
  reportText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12 },
  reportReasons: { alignSelf: 'stretch', gap: 7, marginTop: 14 },
  reportReason: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 },
  reportReasonSelected: { backgroundColor: theme.berryTint, borderColor: theme.berryLine },
  reportReasonText: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12 },
  reportReasonTextSelected: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold },
  reportDetailsInput: { backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 12, borderWidth: 1, color: theme.ink, fontSize: 13, minHeight: 74, padding: 10, textAlignVertical: 'top' },
  savedNote: { color: theme.successText, fontFamily: typography.bodyBold, fontSize: 12 },
  saveError: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12 },
  notice: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 15, borderWidth: 1.5, color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, padding: 14 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17, marginTop: 6 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  objective: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 15, borderWidth: 1, gap: 8, padding: 12 },
  objectiveTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  errorState: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 16, borderWidth: 1.5, gap: 10, padding: 15 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
