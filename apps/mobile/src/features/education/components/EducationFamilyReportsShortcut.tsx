import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationFamilyChildren } from '@/features/education/hooks/useEducationFamilyReports';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
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
  card: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 24, borderWidth: 2, borderBottomWidth: 6, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80, padding: 16 },
  icon: { backgroundColor: theme.paper, padding: 12, borderRadius: 18 },
  title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, lineHeight: 25 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 20 },
}));
