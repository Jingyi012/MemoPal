import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationGuardianLink } from '@/features/education/types/educationRelationship.types';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

type EducationGuardianRequestsProps = Readonly<{
  links: readonly EducationGuardianLink[];
  userId: string;
  isLoading: boolean;
  isError: boolean;
  confirmingId?: string;
  confirmError: boolean;
  decliningId?: string;
  declineError: boolean;
  onConfirm: (linkId: string) => void;
  onDecline: (linkId: string) => void;
  onRetry: () => void;
}>;

export function EducationGuardianRequests({
  links,
  userId,
  isLoading,
  isError,
  confirmingId,
  confirmError,
  decliningId,
  declineError,
  onConfirm,
  onDecline,
  onRetry,
}: EducationGuardianRequestsProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const pending = links.filter((link) => link.status !== 'revoked' && (!link.studentConfirmed || !link.adminVerified));
  const active = links.filter((link) => link.status === 'active');

  if (!isLoading && !isError && pending.length === 0 && active.length === 0) return null;

  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.heading}>{copy.guardianRequests}</Text>
    {isLoading ? <View style={styles.loading}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.body}>{copy.loading}</Text></View> : null}
    {isError ? <View style={styles.notice}>
      <Text accessibilityRole="alert" style={styles.body}>{copy.guardianRequestsError}</Text>
      <AnimatedPressable accessibilityRole="button" onPress={onRetry} style={styles.action}>
        <Text style={styles.actionText}>{copy.retry}</Text>
      </AnimatedPressable>
    </View> : null}
    {pending.map((link) => {
      const isStudent = link.studentUserId === userId;
      const needsStudentConsent = !link.studentConfirmed;
      const isConfirming = confirmingId === link.id;
      const isDeclining = decliningId === link.id;
      const requestDate = new Intl.DateTimeFormat(copy.locale, { dateStyle: 'medium' }).format(new Date(link.createdAt));
      return <View key={link.id} style={styles.card}>
        <Text style={styles.name}>{copy.guardianRequestFrom(link.guardianDisplayName ?? copy.unknownGuardian)}</Text>
        <Text style={styles.body}>{copy.guardianRequestCreated(requestDate)}</Text>
        <Text style={styles.status}>
          {needsStudentConsent
            ? isStudent ? copy.guardianConsentNeeded : copy.guardianAwaitingStudent
            : copy.guardianAwaitingAdmin}
        </Text>
        <View style={styles.actions}>
          {isStudent && needsStudentConsent ? <AnimatedPressable
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(confirmingId || decliningId) }}
            disabled={Boolean(confirmingId || decliningId)}
            onPress={() => onConfirm(link.id)}
            style={[styles.action, (confirmingId || decliningId) && styles.disabled]}>
            <Text style={styles.actionText}>{isConfirming ? copy.confirmingGuardian : copy.confirmGuardian}</Text>
          </AnimatedPressable> : null}
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(confirmingId || decliningId) }}
            disabled={Boolean(confirmingId || decliningId)}
            onPress={() => Alert.alert(isStudent ? copy.declineGuardianTitle : copy.cancelGuardianTitle, isStudent ? copy.declineGuardianBody : copy.cancelGuardianBody, [
              { text: copy.cancel, style: 'cancel' },
              { text: isStudent ? copy.declineGuardianRequest : copy.cancelGuardianRequest, style: 'destructive', onPress: () => onDecline(link.id) },
            ])}
            style={[styles.decline, (confirmingId || decliningId) && styles.disabled]}>
            <Text style={styles.declineText}>{isDeclining ? copy.decliningGuardian : isStudent ? copy.declineGuardianRequest : copy.cancelGuardianRequest}</Text>
          </AnimatedPressable>
        </View>
      </View>;
    })}
    {active.length ? <>
      <Text accessibilityRole="header" style={styles.subheading}>{copy.activeGuardianLinks}</Text>
      {active.map((link) => {
        const isStudent = link.studentUserId === userId;
        const name = isStudent
          ? link.guardianDisplayName ?? copy.unknownGuardian
          : link.studentDisplayName ?? copy.unknownStudent;
        const isRevoking = decliningId === link.id;
        const isProcessing = Boolean(confirmingId || decliningId);
        return <View key={link.id} style={styles.card}>
          <Text style={styles.body}>{copy.guardianLinkWith(name)}</Text>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isProcessing }}
            disabled={isProcessing}
            onPress={() => Alert.alert(copy.revokeActiveGuardianTitle, copy.revokeActiveGuardianBody, [
              { text: copy.cancel, style: 'cancel' },
              { text: copy.revokeActiveGuardian, style: 'destructive', onPress: () => onDecline(link.id) },
            ])}
            style={[styles.decline, isProcessing && styles.disabled]}>
            <Text style={styles.declineText}>{isRevoking ? copy.revokingGuardian : copy.revokeActiveGuardian}</Text>
          </AnimatedPressable>
        </View>;
      })}
    </> : null}
    {confirmError ? <Text accessibilityRole="alert" style={styles.error}>{copy.confirmGuardianError}</Text> : null}
    {declineError ? <Text accessibilityRole="alert" style={styles.error}>
      {links.some((link) => link.id === decliningId && link.status === 'active') ? copy.revokeGuardianError : copy.declineGuardianError}
    </Text> : null}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  section: { gap: 9 },
  heading: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
  subheading: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, marginTop: 5 },
  card: { backgroundColor: theme.paper, borderColor: theme.skyLine, borderRadius: 16, borderWidth: 1.5, gap: 5, padding: 14 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
  name: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  loading: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 42 },
  status: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 18 },
  notice: { backgroundColor: theme.peachTint, borderColor: theme.peachLine, borderRadius: 14, borderWidth: 1, gap: 7, padding: 12 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 11, justifyContent: 'center', marginTop: 5, minHeight: 44, paddingHorizontal: 14 },
  actions: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  decline: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderColor: theme.berryLine, borderRadius: 11, borderWidth: 1, justifyContent: 'center', marginTop: 5, minHeight: 44, paddingHorizontal: 14 },
  declineText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  disabled: { opacity: 0.55 },
  error: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 13, lineHeight: 18 },
}));
