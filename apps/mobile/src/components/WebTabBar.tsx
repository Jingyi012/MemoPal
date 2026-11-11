import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing, appTextStyles } from '@/theme/designSystem';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';

/** Web-only tab bar: React Navigation's default bar still forwards deprecated pointerEvents props. */
export function WebTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const palette = memopalThemes[colorScheme ?? 'light'];
  return (
    <View style={[styles.bar, { backgroundColor: palette.paper, borderTopColor: palette.line }]}>
      {state.routes.map((route, index) => ({ route, index }))
        .filter(({ route }) => {
          const options = descriptors[route.key].options;
          return !('href' in options && options.href === null) &&
            StyleSheet.flatten(options.tabBarItemStyle)?.display !== 'none';
        })
        .map(({ route, index }) => {
          const descriptor = descriptors[route.key];
          const options = descriptor.options;
          const focused = state.index === index;
          const color = focused
            ? options.tabBarActiveTintColor ?? theme.violetDeep
            : options.tabBarInactiveTintColor ?? theme.inkSoft;
          const label = typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              key={route.key}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.item}
              testID={options.tabBarButtonTestID}>
              {options.tabBarIcon?.({ focused, color, size: 23 })}
              <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: 72, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', backgroundColor: theme.paper, borderTopWidth: 1, borderTopColor: theme.line, boxShadow: '0px -2px 8px rgba(43, 42, 61, 0.08)' },
  item: { minWidth: 0, minHeight: 72, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: appSpacing.xs },
  label: { ...appTextStyles.tabLabel, textAlign: 'center' },
});
