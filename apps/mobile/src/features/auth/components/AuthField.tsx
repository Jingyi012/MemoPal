import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { useState } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export function AuthField({ label, onFocus, onBlur, style, ...props }: TextInputProps & { label: string }) {
  const { theme, styles } = useStyles();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep}
        style={[styles.input, focused && styles.focused, style]}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }} />
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  field: { gap: 6 },
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.small.fontSize },
  input: { minHeight: 54, borderRadius: appRadii.control, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, color: theme.ink, paddingHorizontal: appSpacing.lg, paddingVertical: 13, fontFamily: typography.body, fontSize: appTextStyles.body.fontSize },
  focused: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
}));
