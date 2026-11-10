import { View, StyleSheet } from 'react-native';
import { Sparkles } from '@/core/icons';
import { createThemedStyles } from '@/theme/createThemedStyles';

/** The same earned-energy token in the HUD, wallet and balance cards. */
export function AiCreditToken({ size = 28 }: { size?: number }) {
  const { styles, theme } = useStyles();
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.coin, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[styles.face, { borderRadius: size / 2 }]}><Sparkles size={size * .5} color={theme.onSun} /></View>
    <View pointerEvents="none" style={[styles.shine, { width: size * .28, top: size * .16, left: size * .2 }]} />
  </View>;
}
const useStyles = createThemedStyles(theme => StyleSheet.create({
  coin: { backgroundColor: theme.sun, borderColor: '#B9800B', borderWidth: 1, borderBottomWidth: 3, padding: 3, alignItems: 'center', justifyContent: 'center' },
  face: { borderColor: '#E4A716', borderWidth: 1, alignSelf: 'stretch', flex: 1, alignItems: 'center', justifyContent: 'center' },
  shine: { height: 2, borderRadius: 2, backgroundColor: '#FFF1B7', position: 'absolute', transform: [{ rotate: '-30deg' }] },
}));
