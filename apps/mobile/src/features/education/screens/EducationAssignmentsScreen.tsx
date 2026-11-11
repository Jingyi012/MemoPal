import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { EducationGuardianRequests } from '../components/EducationGuardianRequests';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { LinearGradient } from 'expo-linear-gradient';
import { LearningButton } from '../components/LearningUi';
import { getPendingEducationInvitations } from '../utils/classroomInvitations';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { useAuth } from '@/contexts/AuthProvider';
import { EducationAssignmentsList } from '@/features/education/components/EducationAssignmentsList';
import { EducationClassroomInvitations } from '@/features/education/components/EducationClassroomInvitations';
import { EducationClassroomLearningList } from '@/features/education/components/EducationClassroomLearningList';
import { EducationAccountIdCard } from '@/features/education/components/EducationAccountIdCard';
import { EducationAssignmentPlayer } from '@/features/education/components/EducationAssignmentPlayer';
import { EducationFamilyReportsShortcut } from '@/features/education/components/EducationFamilyReportsShortcut';
import { EducationFamilyStudyPreparation } from '../components/EducationFamilyStudyPreparation';
import { educationAttemptApi } from '@/features/education/api/educationAttempt.api';
import { educationAssignmentApi } from '@/features/education/api/educationAssignment.api';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationAssessmentAttempt, EDUCATION_ATTEMPT_KEYS } from '@/features/education/hooks/useEducationAssessmentAttempt';
import { useMyEducationAssignments } from '@/features/education/hooks/useMyEducationAssignments';
import { useEducationGuardianRequests, useEducationClassroomInvitations } from '@/features/education/hooks/useEducationClassroomInvitations';
import { educationAttemptSession } from '@/features/education/services/educationAttemptSession.service';
import type { EducationAssessmentAttempt } from '@/features/education/types/question.types';
import type { MyEducationAssignment } from '@/features/education/types/educationAssignment.types';
import { getEducationAssignmentStatus } from '@/features/education/utils/educationAssignmentStatus';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';

export default function EducationAssignmentsScreen() {
  const { assignmentId, attemptId, practiceType, connections } = useLocalSearchParams<{ assignmentId?: string; attemptId?: string; practiceType?: string; connections?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const assignmentsQuery = useMyEducationAssignments();
  const classroomInvitations = useEducationClassroomInvitations();
  const guardians = useEducationGuardianRequests();
  const attemptQuery = useEducationAssessmentAttempt(attemptId);
  const startAttempt = useMutation({ mutationFn: educationAttemptApi.start, retry: false });
  const leaderboardPreference = useMutation({
    mutationFn: ({ id, include }: { id: string; include: boolean }) => educationAssignmentApi.updateLeaderboardPreference(id, include),
    onSuccess: () => { void assignmentsQuery.refetch(); },
  });
  const [checkingSavedAttempt, setCheckingSavedAttempt] = useState(Boolean(assignmentId && !attemptId));
  const [startError, setStartError] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(connections === '1');
  const [hasUnsavedSketch, setHasUnsavedSketch] = useState(false);
  const [isSketchProcessing, setIsSketchProcessing] = useState(false);
  const [discardSketchVisible, setDiscardSketchVisible] = useState(false);
  const pendingNavigationAction = useRef<NavigationAction | null>(null);
  const allowSketchExitRef = useRef(false);
  const assignments = assignmentsQuery.data ?? [];
  const pendingInvitations = getPendingEducationInvitations(classroomInvitations.memberships.data ?? []).length + (guardians.guardianLinks.data ?? []).filter(link => link.status !== 'revoked' && (!link.studentConfirmed || !link.adminVerified)).length;
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
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CommonHeader title={copy.title} showAiCredits={false} backAction={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {!detailAssignmentId ? (
          <>
            <EducationAssignmentsList workspace
              assignments={assignments}
              isLoading={assignmentsQuery.isLoading}
              isError={assignmentsQuery.isError}
              onRetry={() => { void assignmentsQuery.refetch(); }}
              onOpen={openAssignment}
            />
            {user?.accountMode !== 'RestrictedLearner' ? assignmentsQuery.isSuccess && assignments.length === 0
              ? <LearningButton label={copy.locale.startsWith('zh') ? '探索课程' : 'Explore courses'} onPress={() => router.navigate('/discover' as Href)} />
              : <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/practice' as Href)} style={styles.secondaryAction}>
                <Text style={[styles.actionText, { color: theme.violetDeep }]}>{copy.practiceBrowseTitle}</Text>
              </AnimatedPressable> : null}
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
        {!detailAssignmentId ? <View style={{ gap: 14 }}>
        <EducationClassroomLearningList
          memberships={classroomInvitations.memberships.data ?? []}
          isLoading={classroomInvitations.memberships.isLoading}
          isError={classroomInvitations.memberships.isError}
          onRetry={() => { void classroomInvitations.memberships.refetch(); }}
        />
        <EducationFamilyReportsShortcut />
        </View> : null}
        {!detailAssignmentId ? <View style={{ gap: 14 }}>
          <AnimatedPressable accessibilityRole="button" accessibilityState={{ expanded: connectionsOpen }} onPress={() => setConnectionsOpen(value => !value)} style={styles.connectionToggle}>
            <Text style={styles.preferenceTitle}>{copy.locale.startsWith('zh') ? '邀请与账户' : 'Invitations & account'}{pendingInvitations ? ` · ${pendingInvitations}` : ''}</Text>
            <Text style={styles.body}>{connectionsOpen ? '−' : '+'}</Text>
          </AnimatedPressable>
          {connectionsOpen ? <View style={{ gap: 14 }}>
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
        <EducationGuardianRequests links={guardians.guardianLinks.data ?? []} userId={user?.id ?? ''} isLoading={guardians.guardianLinks.isLoading} isError={guardians.guardianLinks.isError}
          confirmingId={guardians.confirm.isPending ? guardians.confirm.variables : undefined} confirmError={guardians.confirm.isError}
          decliningId={guardians.decline.isPending ? guardians.decline.variables : undefined} declineError={guardians.decline.isError}
          onConfirm={id => guardians.confirm.mutate(id)} onDecline={id => guardians.decline.mutate(id)} onRetry={() => { void guardians.guardianLinks.refetch(); }} />
          </View> : null}
        </View> : null}
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
    </KeyboardAvoidingView>
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
        <LinearGradient colors={theme.hero as [string, string]} start={[0, 0]} end={[1, 1]} style={{ padding: appSpacing.xl, borderRadius: appRadii.card, gap: appSpacing.md, marginBottom: appSpacing.sm }}>
          <Text style={[styles.body, { color: theme.heroInk }]}>{selectedAssignment.courseTitle ?? copy.title}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: theme.heroInk }]}>{selectedAssignment.title}</Text>
          <Text style={[styles.status, styles[availability]]}>{statusLabel}</Text>
        </LinearGradient>
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
        {selectedAssignment.scope === 'family' && isOpen ? <EducationFamilyStudyPreparation
          key={`${user?.id}:${selectedAssignment.id}`} assignmentId={selectedAssignment.id}
          disabled={isStarting || checkingSavedAttempt} /> : null}
        {isOpen ? (
          <LearningButton label={startLabel} disabled={isStarting} loading={isStarting} onPress={onStart} />
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
  content: { gap: 18, padding: appSpacing.lg, paddingBottom: appSpacing.spacious },
  connectionToggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: appSpacing.md, padding: 14, borderRadius: appRadii.card, backgroundColor: theme.violetTint, borderWidth: 1, borderColor: theme.line },
  detailCard: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 6, gap: 14, padding: appSpacing.lg },
  secondaryAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.card, borderWidth: 2, borderBottomWidth: 5, borderColor: theme.line, justifyContent: 'center', minHeight: 48, padding: appSpacing.md },
  preference: { alignItems: 'center', borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'space-between', padding: appSpacing.md },
  preferenceCopy: { flex: 1, gap: 3 },
  preferenceTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight },
  status: { alignSelf: 'flex-start', borderRadius: appRadii.pill, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: appSpacing.xs },
  upcoming: { backgroundColor: theme.skyTint, color: theme.link },
  open: { backgroundColor: theme.mintTint, color: theme.successText },
  pastDue: { backgroundColor: theme.peachTint, color: theme.berryDeep },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, lineHeight: appTextStyles.label.lineHeight },
  state: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 60 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1.5, gap: 5, padding: 15 },
  noticeTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.body.fontSize },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, justifyContent: 'center', marginTop: appSpacing.sm, minHeight: 48, paddingHorizontal: appSpacing.lg },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  disabledAction: { opacity: 0.55 },
}));
