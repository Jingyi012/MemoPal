import { Text, type TextProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';

export function CreditText({ style, ...props }: TextProps) {
  const { colorScheme } = useColorScheme();
  return <Text {...props} style={[{ color: memopalThemes[colorScheme ?? 'light'].ink, lineHeight: 22 }, style]} />;
}
