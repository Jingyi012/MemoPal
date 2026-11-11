import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationCopy } from '@/features/education/i18n';
import type { EducationAttemptQuestion } from '@/features/education/types/question.types';
import { buildEducationShareSummary } from '@/features/education/utils/educationShareSummary';
import { Share2 } from 'lucide-react-native';
import { Share, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

type EducationResultShareButtonProps = Readonly<{
  questionTypes: readonly EducationAttemptQuestion['type'][];
}>;

export function EducationResultShareButton({ questionTypes }: EducationResultShareButtonProps) {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const share = async () => {
    const message = buildEducationShareSummary(questionTypes, {
      completed: copy.shareProgressSummary,
      privacyNote: copy.shareProgressPrivacy,
      questionTypes: copy.questionTypeLabels,
    });
    try {
      await Share.share({ message, title: copy.shareProgressTitle });
    } catch {
      Toast.show({ type: 'error', text1: copy.shareProgressError });
    }
  };

  return (
    <AnimatedPressable accessibilityRole="button" onPress={() => void share()} style={styles.button}>
      <View style={styles.content}>
        <Share2 size={17} color={theme.violetDeep} />
        <Text style={styles.label}>{copy.shareProgress}</Text>
      </View>
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  button: {
    alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine,
    borderRadius: appRadii.control, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15,
  },
  content: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.sm },
  label: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
}));
