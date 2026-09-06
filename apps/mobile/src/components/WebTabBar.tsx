import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { memopalTheme as theme } from '@/theme/memopalTheme';

/** Web-only tab bar: React Navigation's default bar still forwards deprecated pointerEvents props. */
export function WebTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const options = descriptor.options;
        const focused = state.index === index;
        const color = focused
          ? options.tabBarActiveTintColor ?? theme.berryDeep
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
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: 64, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around', backgroundColor: theme.paper, borderTopWidth: 1, borderTopColor: theme.line, boxShadow: '0px -2px 8px rgba(43, 42, 61, 0.08)' },
  item: { minWidth: 64, minHeight: 64, flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 4 },
  label: { fontSize: 10.5, fontWeight: '700' },
});
