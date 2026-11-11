import { createContext, forwardRef, useContext } from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { appFontWeights, appTextStyles } from '@/theme/designSystem';
import { memopalThemes } from '@/theme/memopalTheme';

const TextAncestor = createContext(false);

/** Default body face and ink; nested text keeps its parent's formatting. */
export const AppText = forwardRef<NativeText, TextProps>(function AppText({ style, ...props }, ref) {
  const nested = useContext(TextAncestor);
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const resolved = StyleSheet.flatten(style);
  const family = resolved?.fontFamily;
  const weight = family ? appFontWeights[family as keyof typeof appFontWeights] : undefined;
  return <TextAncestor.Provider value={true}>
    <NativeText ref={ref} {...props} style={[
      !nested && { fontFamily: appTextStyles.body.fontFamily, fontSize: appTextStyles.body.fontSize, lineHeight: resolved?.fontSize == null ? appTextStyles.body.lineHeight : undefined, color: theme.ink },
      weight && { fontWeight: weight },
      style,
    ]} />
  </TextAncestor.Provider>;
});

cssInterop(AppText, { className: 'style' });
