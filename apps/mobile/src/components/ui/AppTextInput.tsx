import { forwardRef } from 'react';
import { StyleSheet, TextInput as NativeTextInput, type TextInputProps } from 'react-native';
import { cssInterop, useColorScheme } from 'nativewind';
import { appFontWeights, appTextStyles } from '@/theme/designSystem';
import { memopalThemes } from '@/theme/memopalTheme';

export type AppTextInputRef = NativeTextInput;

/** A shared text baseline without changing keyboard, validation or input behavior. */
export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(function AppTextInput({ style, placeholderTextColor, ...props }, ref) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const family = StyleSheet.flatten(style)?.fontFamily;
  const weight = family ? appFontWeights[family as keyof typeof appFontWeights] : undefined;
  return <NativeTextInput ref={ref} {...props} placeholderTextColor={placeholderTextColor ?? theme.inkSoft}
    style={[{ fontFamily: appTextStyles.body.fontFamily, fontSize: appTextStyles.body.fontSize, color: theme.ink }, weight && { fontWeight: weight }, style]} />;
});

cssInterop(AppTextInput, { className: 'style' });
