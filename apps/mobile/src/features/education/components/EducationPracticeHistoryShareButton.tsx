import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import { buildEducationPracticeHistoryShareSummary } from '@/features/education/utils/educationShareSummary';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Share2 } from 'lucide-react-native';
import { Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

type EducationPracticeHistoryShareButtonProps = Readonly<{ recentQuestionCount: number }>;

export function EducationPracticeHistoryShareButton({ recentQuestionCount }: EducationPracticeHistoryShareButtonProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const share = async () => {
    const message = buildEducationPracticeHistoryShareSummary(recentQuestionCount, {
      summary: copy.sharePracticeHistorySummary,
      privacyNote: copy.sharePracticeHistoryPrivacy,
    });
    try {
      await Share.share({ message, title: copy.shareProgressTitle });
    } catch {
      Toast.show({ type: 'error', text1: copy.shareProgressError });
    }
  };

  return <AnimatedPressable accessibilityRole="button" onPress={() => void share()} style={styles.button}>
    <View style={styles.content}>
      <Share2 size={17} color={theme.violetDeep} />
      <Text style={styles.label}>{copy.shareProgress}</Text>
    </View>
  </AnimatedPressable>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  button: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 13, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  content: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  label: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
