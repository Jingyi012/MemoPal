import { appSpacing } from '@/theme/designSystem';
import { AppButton } from '@/components/ui/AppButton';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  previousLabel?: string;
  nextLabel?: string;
  onPrevious?: () => void;
  onNext: () => void;
  disableNext?: boolean;
}

export function StepNavigationFooter({
  previousLabel = 'Previous',
  nextLabel = 'Next',
  onPrevious,
  onNext,
  disableNext = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const { styles } = useStyles();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
      {onPrevious && (
        <AppButton label={previousLabel} onPress={onPrevious} size="large" style={styles.previous} variant="secondary" />
      )}
      <AppButton disabled={disableNext} fullWidth label={nextLabel} onPress={onNext} size="large" style={styles.next} />
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  container: { alignItems: 'stretch', backgroundColor: theme.paper, borderTopColor: theme.violetLine, borderTopWidth: 1.5, flexDirection: 'row', gap: appSpacing.md, padding: appSpacing.xl },
  previous: { flex: 1 },
  next: { flex: 2 },
}));
