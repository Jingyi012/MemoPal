import { memopalThemes } from '@/theme/memopalTheme';
import { useColorScheme } from 'nativewind';
import { StyleSheet, Text, View } from 'react-native';

export function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  return (
    <View accessible={false} style={[styles.icon, focused && { backgroundColor: theme.sunTint, borderColor: theme.sunLine }]}>
      <Text style={styles.emoji}>{emoji}</Text>
      {focused ? <View style={[styles.dot, { backgroundColor: theme.berryDeep }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 48, height: 32, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 21, lineHeight: 26 },
  dot: { position: 'absolute', right: 3, top: 3, height: 5, width: 5, borderRadius: 3 },
});
