import type { AppButtonProps } from '@/components/ui/AppButton';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ActivityIndicator, Text } from 'react-native';
import { useLearningStyles } from './LearningUi';
import { learningTypography as typography } from '../theme/learningTheme';

/** Compatibility with shared action props for learning errors, assignments and dialogs. */
export function LearningAppButton({ label, icon: Icon, trailingIcon: TrailingIcon, leadingContent, accessibilityLabel, accessibilityHint, onPress, disabled, loading, fullWidth, lively, pressOnIn, variant = 'primary', size = 'regular', style, labelStyle }: AppButtonProps) {
  const { theme } = useLearningStyles();
  const inactive = !!disabled || !!loading;
  const solid = variant === 'primary' || variant === 'destructive';
  const iconOnly = variant === 'icon' || !label;
  const textOnly = variant === 'tertiary';
  const color = inactive ? theme.inkSoft : solid ? theme.onAccent : theme.violetDeep;
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityHint={accessibilityHint} accessibilityState={{ disabled: inactive, busy: loading }} disabled={inactive} lively={lively} pressOnIn={pressOnIn} onPress={onPress} style={[{
    minHeight: size === 'compact' || iconOnly ? 44 : size === 'large' ? 54 : 48, minWidth: iconOnly ? 44 : undefined,
    borderRadius: iconOnly ? 14 : 18, borderWidth: solid || textOnly ? 0 : 2, borderBottomWidth: textOnly ? 0 : 5,
    borderColor: inactive ? theme.disabledShadow : solid ? theme.primaryShadow : theme.line,
    backgroundColor: textOnly ? 'transparent' : inactive ? theme.disabled : variant === 'destructive' ? theme.berryDeep : solid ? theme.violetDeep : iconOnly ? theme.violetTint : theme.paper,
    alignSelf: fullWidth ? 'stretch' : undefined, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: iconOnly ? 10 : 16, paddingVertical: 10,
  }, style]}>
    {loading ? <ActivityIndicator color={color} /> : leadingContent ?? (Icon ? <Icon size={18} color={color} /> : null)}
    {label ? <Text style={[{ color, fontFamily: typography.displayExtraBold, fontSize: size === 'large' ? 16 : 14, lineHeight: 22, textAlign: 'center', flexShrink: 1 }, labelStyle]}>{label}</Text> : null}
    {TrailingIcon && !loading ? <TrailingIcon size={18} color={color} /> : null}
  </AnimatedPressable>;
}
