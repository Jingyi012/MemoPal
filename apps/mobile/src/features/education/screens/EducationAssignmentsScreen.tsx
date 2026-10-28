import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useAuth } from '@/contexts/AuthProvider';
import { EducationAssignmentsList } from '@/features/education/components/EducationAssignmentsList';
import { EducationClassroomInvitations } from '@/features/education/components/EducationClassroomInvitations';
import { EducationClassroomLearningList } from '@/features/education/components/EducationClassroomLearningList';
import { EducationAccountIdCard } from '@/features/education/components/EducationAccountIdCard';
import { EducationAssignmentPlayer } from '@/features/education/components/EducationAssignmentPlayer';
import { EducationFamilyReportsShortcut } from '@/features/education/components/EducationFamilyReportsShortcut';
import { educationAttemptApi } from '@/features/education/api/educationAttempt.api';
import { educationAssignmentApi } from '@/features/education/api/educationAssignment.api';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationAssessmentAttempt, EDUCATION_ATTEMPT_KEYS } from '@/features/education/hooks/useEducationAssessmentAttempt';
import { useMyEducationAssignments } from '@/features/education/hooks/useMyEducationAssignments';
import { useEducationClassroomInvitations } from '@/features/education/hooks/useEducationClassroomInvitations';
import { educationAttemptSession } from '@/features/education/services/educationAttemptSession.service';
import type { EducationAssessmentAttempt } from '@/features/education/types/question.types';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { getEducationAssignmentStatus } from '@/features/education/utils/educationAssignmentStatus';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

export default function EducationAssignmentsScreen() {
  const { assignmentId, attemptId, practiceType } = useLocalSearchParams<{ assignmentId?: string; attemptId?: string; practiceType?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const assignmentsQuery = useMyEducationAssignments();
  const classroomInvitations = useEducationClassroomInvitations();
  const attemptQuery = useEducationAssessmentAttempt(attemptId);
  const startAttempt = useMutation({ mutationFn: educationAttemptApi.start, retry: false });
  const leaderboardPreference = useMutation({
    mutationFn: ({ id, include }: { id: string; include: boolean }) => educationAssignmentApi.updateLeaderboardPreference(id, include),
    onSuccess: () => { void assignmentsQuery.refetch(); },
  });
  const [checkingSavedAttempt, setCheckingSavedAttempt] = useState(Boolean(assignmentId && !attemptId));
  const [startError, setStartError] = useState(false);
  const [hasUnsavedSketch, setHasUnsavedSketch] = useState(false);
  const [isSketchProcessing, setIsSketchProcessing] = useState(false);
  const [discardSketchVisible, setDiscardSketchVisible] = useState(false);
  const pendingNavigationAction = useRef<NavigationAction | null>(null);
  const allowSketchExitRef = useRef(false);
  const assignments = assignmentsQuery.data ?? [];
  const detailAssignmentId = assignmentId ?? attemptQuery.data?.assignmentId;
  const assignment = assignments.find((item) => item.id === detailAssignmentId);
  const handleSketchWorkChange = useCallback((hasWork: boolean, processing: boolean) => {
    setHasUnsavedSketch(hasWork);
    setIsSketchProcessing(processing);
  }, []);
  const confirmSketchDiscard = useCallback(({ data }: { data: { action: NavigationAction } }) => {
    pendingNavigationAction.current = data.action;
    setDiscardSketchVisible(true);
  }, []);
  usePreventRemove((hasUnsavedSketch || isSketchProcessing) && !allowSketchExitRef.current, confirmSketchDiscard);

  useEffect(() => {
    const action = pendingNavigationAction.current;
    if (!action || hasUnsavedSketch || isSketchProcessing) return;
    pendingNavigationAction.current = null;
    allowSketchExitRef.current = true;
    setDiscardSketchVisible(false);
    navigation.dispatch(action);
  }, [hasUnsavedSketch, isSketchProcessing, navigation]);

  useEffect(() => {
    if (!assignmentId || attemptId || !user?.id) {
      setCheckingSavedAttempt(false);
      return;
    }
    let cancelled = false;
    setCheckingSavedAttempt(true);
    void educationAttemptSession.getAttemptId(user.id, assignmentId).then((savedAttemptId) => {
      if (cancelled) return;
      if (savedAttemptId) router.setParams({ attemptId: savedAttemptId });
      else setCheckingSavedAttempt(false);
    }).catch(() => {
      if (!cancelled) setCheckingSavedAttempt(false);
    });
    return () => { cancelled = true; };
  }, [assignmentId, attemptId, router, user?.id]);

  const updateAttempt = useCallback((attempt: EducationAssessmentAttempt) => {
    if (!user?.id) return;
    queryClient.setQueryData(EDUCATION_ATTEMPT_KEYS.detail(user.id, attempt.id), attempt);
  }, [queryClient, user?.id]);

  const handleStart = async (selectedAssignment: MyEducationAssignment) => {
    if (!user?.id || getEducationAssignmentStatus(selectedAssignment) !== 'open') return;
    setStartError(false);
    try {
      const attempt = await startAttempt.mutateAsync(selectedAssignment.id);
      await educationAttemptSession.saveAttemptId(user.id, selectedAssignment.id, attempt.id);
      updateAttempt(attempt);
      router.setParams({ attemptId: attempt.id });
      setCheckingSavedAttempt(false);
    } catch {
      setStartError(true);
    }
  };

  const openAssignment = (selectedAssignment: MyEducationAssignment) => router.push({
    pathname: '/education/assignments',
    params: { assignmentId: selectedAssignment.id },
  } as Href);

  const retryRestore = () => {
    if (attemptId) void attemptQuery.refetch();
    else void assignmentsQuery.refetch();
  };

  return (
    <View style={styles.page}>
      <CommonHeader title={copy.title} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {user?.id ? <EducationAccountIdCard accountId={user.id} /> : null}
        <EducationClassroomInvitations
          memberships={classroomInvitations.memberships.data ?? []}
          isLoading={classroomInvitations.memberships.isLoading}
          isError={classroomInvitations.memberships.isError}
          acceptingId={classroomInvitations.accept.isPending ? classroomInvitations.accept.variables : undefined}
          acceptError={classroomInvitations.accept.isError}
          decliningId={classroomInvitations.decline.isPending ? classroomInvitations.decline.variables : undefined}
          declineError={classroomInvitations.decline.isError}
          onAccept={(membershipId) => classroomInvitations.accept.mutate(membershipId)}
          onDecline={(membershipId) => classroomInvitations.decline.mutate(membershipId)}
          onRetry={() => { void classroomInvitations.memberships.refetch(); }}
        />
        {!detailAssignmentId ? <EducationClassroomLearningList
          memberships={classroomInvitations.memberships.data ?? []}
          isLoading={classroomInvitations.memberships.isLoading}
          isError={classroomInvitations.memberships.isError}
          onRetry={() => { void classroomInvitations.memberships.refetch(); }}
        /> : null}
        {!detailAssignmentId ? <EducationFamilyReportsShortcut /> : null}
        {!detailAssignmentId ? (
          <>
            {user?.accountMode !== 'RestrictedLearner' ? <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/practice' as Href)} style={styles.action}>
              <Text style={styles.actionText}>{copy.practiceBrowseTitle}</Text>
            </AnimatedPressable> : null}
            <EducationAssignmentsList
              assignments={assignments}
              isLoading={assignmentsQuery.isLoading}
              isError={assignmentsQuery.isError}
              onRetry={() => { void assignmentsQuery.refetch(); }}
              onOpen={openAssignment}
            />
          </>
        ) : checkingSavedAttempt ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.violetDeep} />
            <Text style={styles.body}>{copy.loading}</Text>
          </View>
        ) : assignmentsQuery.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.violetDeep} />
            <Text style={styles.body}>{copy.loading}</Text>
          </View>
        ) : assignmentsQuery.isError ? (
          renderNotice({ title: copy.loadErrorTitle, body: copy.loadErrorBody, action: copy.retry, onAction: retryRestore })
        ) : !assignment ? (
          renderNotice({ title: copy.notFoundTitle, body: copy.notFoundBody })
        ) : attemptId && attemptQuery.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={theme.violetDeep} />
            <Text style={styles.body}>{copy.loading}</Text>
          </View>
        ) : attemptId && attemptQuery.isError ? (
          renderNotice({ title: copy.attemptLoadError, body: copy.loadErrorBody, action: copy.attemptLoadRetry, onAction: retryRestore })
        ) : attemptId && attemptQuery.data ? (
          <EducationAssignmentPlayer attempt={attemptQuery.data} classroomAssignment={assignment.scope === 'classroom'} initialPracticeType={practiceType} onAttemptUpdated={updateAttempt} onSketchWorkChange={handleSketchWorkChange} />
        ) : (
          renderAssignmentStartCard({
            assignment,
            startLabel: startAttempt.isPending ? copy.starting : copy.start,
            statusLabel: copy[getEducationAssignmentStatus(assignment)],
            isOpen: getEducationAssignmentStatus(assignment) === 'open',
            isStarting: startAttempt.isPending,
            startError,
            onStart: () => { void handleStart(assignment); },
          })
        )}
      </ScrollView>
      <ConfirmModal visible={discardSketchVisible}
        title={isSketchProcessing ? copy.handwritingWaitTitle : copy.handwritingLeaveTitle}
        description={isSketchProcessing ? copy.handwritingWaitBody : copy.handwritingLeaveBody}
        confirmText={copy.handwritingLeaveConfirm} cancelText={copy.cancel} destructive isLoading={isSketchProcessing}
        onCancel={() => { pendingNavigationAction.current = null; setDiscardSketchVisible(false); }}
        onConfirm={() => {
          const action = pendingNavigationAction.current;
          pendingNavigationAction.current = null;
          setDiscardSketchVisible(false);
          if (!action || isSketchProcessing) return;
          allowSketchExitRef.current = true;
          navigation.dispatch(action);
        }} />
    </View>
  );

  function renderNotice({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
    return (
      <View style={styles.notice}>
        <Text accessibilityRole="header" style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
        {action && onAction ? (
          <AnimatedPressable accessibilityRole="button" onPress={onAction} style={styles.action}>
            <Text style={styles.actionText}>{action}</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    );
  }

  function renderAssignmentStartCard({
    assignment: selectedAssignment,
    startLabel,
    statusLabel,
    isOpen,
    isStarting,
    startError: hasStartError,
    onStart,
  }: {
    assignment: MyEducationAssignment;
    startLabel: string;
    statusLabel: string;
    isOpen: boolean;
    isStarting: boolean;
    startError: boolean;
    onStart: () => void;
  }) {
    const locale = copy.locale;
    const dateOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
    const formatDate = (date: string) => new Intl.DateTimeFormat(locale, dateOptions).format(new Date(date));
    const availability = getEducationAssignmentStatus(selectedAssignment);
    return (
      <View style={styles.detailCard}>
        <Text accessibilityRole="header" style={styles.title}>{selectedAssignment.title}</Text>
        <Text style={[styles.status, styles[availability]]}>{statusLabel}</Text>
        <Text style={styles.body}>{copy.opensAt}: {formatDate(selectedAssignment.opensAt)}</Text>
        <Text style={styles.body}>{copy.dueAt}: {formatDate(selectedAssignment.dueAt)}</Text>
        <Text style={styles.body}>
          {selectedAssignment.timeLimitMinutes == null ? copy.noTimeLimit : copy.timeLimit(selectedAssignment.timeLimitMinutes)}
        </Text>
        {selectedAssignment.scope === 'classroom' && selectedAssignment.studentLeaderboardEnabled && !selectedAssignment.resultsPublishedAt ? (
          <View style={styles.preference}>
            <View style={styles.preferenceCopy}>
              <Text style={styles.preferenceTitle}>{copy.includeInClassLeaderboard}</Text>
              <Text style={styles.body}>{copy.classLeaderboardPrivacy}</Text>
            </View>
            <Switch
              accessibilityLabel={copy.includeInClassLeaderboard}
              value={selectedAssignment.includeInStudentLeaderboard}
              disabled={leaderboardPreference.isPending}
              onValueChange={(include) => leaderboardPreference.mutate({ id: selectedAssignment.id, include })}
            />
          </View>
        ) : null}
        {leaderboardPreference.isError ? <Text accessibilityRole="alert" style={styles.error}>{copy.loadErrorBody}</Text> : null}
        {isOpen ? (
          <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: isStarting }} disabled={isStarting} onPress={onStart} style={[styles.action, isStarting && styles.disabledAction]}>
            <Text style={styles.actionText}>{startLabel}</Text>
          </AnimatedPressable>
        ) : (
          <Text style={styles.body}>{copy.notOpen}</Text>
        )}
        {hasStartError ? <Text accessibilityRole="alert" style={styles.error}>{copy.startError}</Text> : null}
      </View>
    );
  }
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 15, padding: 20, paddingBottom: 40 },
  detailCard: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 20, borderWidth: 1.5, gap: 8, padding: 17 },
  preference: { alignItems: 'center', borderColor: theme.line, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'space-between', padding: 12 },
  preferenceCopy: { flex: 1, gap: 3 },
  preferenceTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, lineHeight: 26 },
  status: { alignSelf: 'flex-start', borderRadius: 999, fontFamily: typography.bodyExtraBold, fontSize: 12, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 },
  upcoming: { backgroundColor: theme.skyTint, color: theme.link },
  open: { backgroundColor: theme.mintTint, color: theme.successText },
  pastDue: { backgroundColor: theme.peachTint, color: theme.berryDeep },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 14, lineHeight: 20 },
  state: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 60 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 16, borderWidth: 1.5, gap: 5, padding: 15 },
  noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', marginTop: 8, minHeight: 48, paddingHorizontal: 16 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 19 },
  disabledAction: { opacity: 0.55 },
}));
