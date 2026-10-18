import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationFamilyChildren } from '@/features/education/hooks/useEducationFamilyReports';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export function EducationFamilyReportsShortcut() {
  const copy = useEducationCopy();
  const router = useRouter();
  const children = useEducationFamilyChildren();
  const { styles } = useStyles();
  if (!children.data?.length) return null;
  return <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/family-reports')} style={styles.card}>
    <Text style={styles.title}>{copy.familyReports}</Text>
    <Text style={styles.body}>{copy.familyReportsDescription}</Text>
  </AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  card: { backgroundColor: theme.skyTint, borderColor: theme.skyLine, borderRadius: 16, borderWidth: 1.5, gap: 4, minHeight: 60, padding: 14 },
  title: { color: theme.link, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 17 },
}));
