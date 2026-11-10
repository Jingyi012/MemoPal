import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  currentStep: 1 | 2;
  firstLabel?: string;
  secondLabel?: string;
};

/** Shared two-step rhythm for both techniques: prepare the list, then build scenes. */
export function ComposerProgress({ currentStep, firstLabel = 'Prepare', secondLabel = 'Build scenes' }: Props) {
  const { styles } = useStyles();
  return (
    <View style={styles.wrapper} accessibilityLabel={`Step ${currentStep} of 2`}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: currentStep === 1 ? '50%' : '100%' }]} />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, currentStep >= 1 && styles.activeLabel]}>1  {firstLabel}</Text>
        <Text style={[styles.label, currentStep >= 2 && styles.activeLabel]}>2  {secondLabel}</Text>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  wrapper: { marginBottom: 16 },
  track: { height: 5, overflow: 'hidden', borderRadius: 999, backgroundColor: theme.line },
  fill: { height: '100%', borderRadius: 999, backgroundColor: theme.violetDeep },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  label: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  activeLabel: { color: theme.ink },
}));
