import { AppText as Text } from '@/components/ui/AppText';
import { type TextProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { memopalThemes } from '@/theme/memopalTheme';
import { appTextStyles } from '@/theme/designSystem';

export function CreditText({ style, ...props }: TextProps) {
  const { colorScheme } = useColorScheme();
  return <Text {...props} style={[{ color: memopalThemes[colorScheme ?? 'light'].ink, lineHeight: appTextStyles.body.lineHeight }, style]} />;
}
