import Ionicons from '@expo/vector-icons/Ionicons';
import { memopalThemes } from '@/theme/memopalTheme';
import { useColorScheme } from 'nativewind';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  focused: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
};

export function TabIcon({ icon, focused }: Props) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  return (
    <View accessible={false} style={[styles.icon, focused && { backgroundColor: theme.violetTint, borderColor: theme.violetLine }]}>
      <Ionicons color={focused ? theme.violetDeep : theme.inkSoft} name={icon} size={20} />
      {focused ? <View style={[styles.dot, { backgroundColor: theme.violetDeep }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 48, height: 32, borderRadius: 14, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', right: 3, top: 3, height: 5, width: 5, borderRadius: 3 },
});
