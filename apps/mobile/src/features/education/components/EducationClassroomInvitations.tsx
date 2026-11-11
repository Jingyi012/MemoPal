import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationClassroomMembership } from '@/features/education/types/educationRelationship.types';
import { getPendingEducationInvitations } from '../utils/classroomInvitations';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

type EducationClassroomInvitationsProps = Readonly<{
  memberships: readonly EducationClassroomMembership[];
  isLoading: boolean;
  isError: boolean;
  acceptingId?: string;
  acceptError: boolean;
  decliningId?: string;
  declineError: boolean;
  onAccept: (membershipId: string) => void;
  onDecline: (membershipId: string) => void;
  onRetry: () => void;
}>;

export function EducationClassroomInvitations({
  memberships,
  isLoading,
  isError,
  acceptingId,
  acceptError,
  decliningId,
  declineError,
  onAccept,
  onDecline,
  onRetry,
}: EducationClassroomInvitationsProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const pendingInvitations = getPendingEducationInvitations(memberships);

  if (!isLoading && !isError && pendingInvitations.length === 0) return null;

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.heading}>{copy.classroomInvitations}</Text>
    {isLoading ? <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View> : null}
    {isError ? <View style={styles.notice}>
      <Text accessibilityRole="alert" style={styles.body}>{copy.classroomInvitationsError}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.action}>
        <Text style={styles.actionText}>{copy.retry}</Text>
      </AnimatedPressable>
    </View> : null}
    {pendingInvitations.map((invitation) => {
      const isAccepting = acceptingId === invitation.id;
      const isDeclining = decliningId === invitation.id;
      const isProcessing = Boolean(acceptingId || decliningId);
      const expiry = new Intl.DateTimeFormat(copy.locale, { dateStyle: 'medium' }).format(new Date(invitation.expiresAt));
      return <View key={invitation.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.icon}><Ionicons name="mail-open-outline" size={28} color={theme.violetDeep} /></View>
          <Text style={styles.className}>{invitation.classroomName ?? copy.classroomNameUnavailable}</Text>
        </View>
        <Text style={styles.body}>{copy.classroomInviteRole(invitation.role)}</Text>
        <Text style={styles.body}>{copy.classroomInviteExpires(expiry)}</Text>
        <View style={styles.actions}>
          <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: isProcessing }} disabled={isProcessing} onPress={() => onAccept(invitation.id)} style={[styles.action, isProcessing && styles.disabled]}>
          <Text style={styles.actionText}>{isAccepting ? copy.acceptingClassroomInvitation : copy.acceptClassroomInvitation}</Text>
          </AnimatedPressable>
          <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: isProcessing }} disabled={isProcessing} onPress={() => Alert.alert(copy.declineClassroomTitle, copy.declineClassroomBody, [
            { text: copy.cancel, style: 'cancel' },
            { text: copy.declineClassroomInvitation, style: 'destructive', onPress: () => onDecline(invitation.id) },
          ])} style={[styles.decline, isProcessing && styles.disabled]}>
            <Text style={styles.declineText}>{isDeclining ? copy.decliningClassroomInvitation : copy.declineClassroomInvitation}</Text>
          </AnimatedPressable>
        </View>
      </View>;
    })}
    {acceptError ? <Text accessibilityRole="alert" style={styles.error}>{copy.acceptClassroomInvitationError}</Text> : null}
    {declineError ? <Text accessibilityRole="alert" style={styles.error}>{copy.declineClassroomInvitationError}</Text> : null}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { gap: 9 },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.cardTitle.fontSize },
  card: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 6, gap: appSpacing.md, padding: 18 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: appSpacing.md },
  icon: { padding: appSpacing.md, backgroundColor: theme.violetTint, borderRadius: appRadii.card },
  className: { flex: 1, color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize, lineHeight: appTextStyles.screenTitle.lineHeight },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
  state: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 45 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: appRadii.control, borderWidth: 1, gap: 7, padding: appSpacing.md },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: appRadii.control, borderBottomWidth: 5, borderColor: theme.primaryShadow, justifyContent: 'center', marginTop: 5, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  actions: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: appSpacing.sm },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, textAlign: 'center' },
  decline: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 2, borderBottomWidth: 5, justifyContent: 'center', marginTop: 5, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  declineText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
}));
