import { AppText as Text } from '@/components/ui/AppText';
import { appTextStyles } from '@/theme/designSystem';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LearningIconButton } from './LearningIconButton';
import { LearningProgress, useLearningStyles } from './LearningUi';
import { createLearningStyles, learningLayout, learningTypography } from '../theme/learningTheme';

export function LearningQuizHeader({ position, total, onExit, exitLabel }: { position: number; total: number; onExit: () => void; exitLabel: string }) {
  const insets = useSafeAreaInsets();
  const { styles, theme } = useStyles();
  return <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
    <LearningIconButton icon="close" label={exitLabel} onPress={onExit} />
    <View style={{ flex: 1 }}><LearningProgress value={position} total={total} color={theme.grass} height={10} /></View>
    <Text accessibilityLabel={`${position} / ${total}`} style={styles.count}>{position}/{total}</Text>
  </View>;
}

export function LearningFeedbackDock({ feedback, embedded = false, children }: { feedback?: boolean | null; embedded?: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { styles: shared, theme } = useLearningStyles();
  const { styles } = useStyles();
  return <View style={[shared.dock, !embedded && styles.feedback, {
    paddingBottom: embedded ? learningLayout.pagePadding : Math.max(learningLayout.pagePadding, insets.bottom),
    backgroundColor: feedback === true ? theme.mintTint : feedback === false ? theme.berryTint : theme.canvas,
    borderColor: feedback === true ? theme.mintLine : feedback === false ? theme.berryLine : theme.line,
  }]}>{children}</View>;
}
const useStyles = createLearningStyles(theme => ({
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: learningLayout.gap, paddingHorizontal: learningLayout.pagePadding, paddingBottom: learningLayout.gap },
  count: { color: theme.violetDeep, fontFamily: learningTypography.bodyExtraBold, fontSize: appTextStyles.label.fontSize, flexShrink: 0, textAlign: 'right' as const },
  feedback: { maxHeight: '65%' as const, borderTopWidth: learningLayout.borderWidth, gap: 10, paddingTop: learningLayout.pagePadding },
}));
