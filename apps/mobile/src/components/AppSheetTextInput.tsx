import { AppTextInput as TextInput, type AppTextInputRef } from '@/components/ui/AppTextInput';
import { Platform, type TextInputProps } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { cssInterop, useColorScheme } from 'nativewind';
import { appTextStyles } from '@/theme/designSystem';
import { memopalThemes } from '@/theme/memopalTheme';

// Gorhom's blur handler uses currentlyFocusedInput, absent from RN Web's
// TextInput.State. Keep its keyboard integration on native platforms only.
export const AppSheetTextInput = forwardRef<AppTextInputRef, TextInputProps>(function AppSheetTextInput({ style, placeholderTextColor, ...props }, ref) {
  const { colorScheme } = useColorScheme();
  const theme = memopalThemes[colorScheme ?? 'light'];
  const Input = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;
  return <Input ref={(instance: AppTextInputRef | null | undefined) => {
    if (typeof ref === 'function') ref(instance ?? null);
    else if (ref) ref.current = instance ?? null;
  }} {...props} placeholderTextColor={placeholderTextColor ?? theme.inkSoft}
    style={[{ fontFamily: appTextStyles.body.fontFamily, fontSize: appTextStyles.body.fontSize, color: theme.ink }, style]} />;
});

cssInterop(AppSheetTextInput, { className: 'style' });
