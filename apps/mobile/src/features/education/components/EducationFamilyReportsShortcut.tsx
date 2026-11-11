import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationFamilyChildren } from '@/features/education/hooks/useEducationFamilyReports';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export function EducationFamilyReportsShortcut() {
  const copy = useEducationCopy();
  const router = useRouter();
  const children = useEducationFamilyChildren();
  const { styles, theme } = useStyles();
  if (!children.data?.length) return null;
  return <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/family-reports')} style={styles.card}>
    <View style={styles.icon}><Ionicons name="bar-chart-outline" size={28} color={theme.link} /></View>
    <View style={{ flex: 1, gap: 7 }}><Text style={styles.title}>{copy.familyReports}</Text>
    <Text style={styles.body}>{copy.familyReportsDescription}</Text></View>
    <Ionicons name="chevron-forward" size={22} color={theme.link} />
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: appRadii.hero, borderWidth: 2, borderBottomWidth: 6, flexDirection: 'row', alignItems: 'center', gap: appSpacing.md, minHeight: 80, padding: appSpacing.lg },
  icon: { backgroundColor: theme.paper, padding: appSpacing.md, borderRadius: appRadii.card },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight },
}));
