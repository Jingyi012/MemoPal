import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
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
  label: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  input: { minHeight: 54, borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, color: theme.ink, paddingHorizontal: 16, paddingVertical: 13, fontFamily: typography.body, fontSize: 15 },
  focused: { borderColor: theme.violetDeep, backgroundColor: theme.violetTint },
}));
