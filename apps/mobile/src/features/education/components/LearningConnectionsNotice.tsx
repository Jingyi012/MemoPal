import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing } from '@/theme/designSystem';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationClassroomInvitations, useEducationGuardianRequests } from '../hooks/useEducationClassroomInvitations';
import { getPendingEducationInvitations } from '../utils/classroomInvitations';
import { useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningConnectionsNotice() {
  const { styles: s, theme } = useLearningStyles(); const { zh } = useLearningCopy(); const router = useRouter();
  const classroom = useEducationClassroomInvitations(); const guardians = useEducationGuardianRequests();
  const count = getPendingEducationInvitations(classroom.memberships.data ?? []).length + (guardians.guardianLinks.data ?? []).filter(link => link.status !== 'revoked' && (!link.studentConfirmed || !link.adminVerified)).length;
  if (!count) return null;
  return <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/assignments?connections=1')} style={[s.row, { minHeight: 64, padding: appSpacing.md, borderRadius: appRadii.control, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.line }]}><Ionicons name="people-outline" size={24} color={theme.successText} /><View style={{ flex: 1, gap: appSpacing.xs }}><Text style={s.heading}>{zh ? `${count} 个待处理邀请` : `${count} pending invitations`}</Text><Text style={s.small}>{zh ? '班级与家庭关系' : 'Classroom and family connections'}</Text></View><Ionicons name="chevron-forward" size={20} color={theme.successText} /></AnimatedPressable>;
}
