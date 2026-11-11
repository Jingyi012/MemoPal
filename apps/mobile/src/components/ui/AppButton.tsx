import { AppText as Text } from '@/components/ui/AppText';
import { appLayout, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import type { LucideIcon } from '@/core/icons';
import { createMemopalColorRoles } from '@/theme/memopalTheme';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'icon';
type ButtonSize = 'compact' | 'regular' | 'large';

type SharedProps = {
  accessibilityHint?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  lively?: boolean;
  loading?: boolean;
  onPress: () => void;
  pressOnIn?: boolean;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: ButtonVariant;
  labelStyle?: StyleProp<TextStyle>;
};

type LabeledButtonProps = SharedProps & {
  accessibilityLabel?: string;
  icon?: LucideIcon;
  leadingContent?: ReactNode;
  label: string;
  trailingIcon?: LucideIcon;
};

type IconButtonProps = SharedProps & {
  accessibilityLabel: string;
  icon: LucideIcon;
  leadingContent?: ReactNode;
  label?: never;
  trailingIcon?: never;
};

export type AppButtonProps = LabeledButtonProps | IconButtonProps;

/** Shared button hierarchy for actions across the mobile app. */
export function AppButton({
  accessibilityHint,
  accessibilityLabel,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  label,
  labelStyle,
  leadingContent,
  lively = false,
  loading = false,
  onPress,
  pressOnIn = false,
  size = 'regular',
  style,
  trailingIcon: TrailingIcon,
  variant,
}: AppButtonProps) {
  const { styles, theme } = useStyles();
  const roles = createMemopalColorRoles(theme);
  const buttonVariant = variant ?? (label ? 'primary' : 'icon');
  const isDisabled = disabled || loading;
  const iconColor = isDisabled
    ? roles.actionOnDisabled
    : buttonVariant === 'primary' || buttonVariant === 'destructive'
      ? roles.actionOn
      : roles.actionOnSurface;
  const buttonIconSize = size === 'large' ? 18 : 16;

  return (
    <AnimatedPressable
      lively={lively}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      pressOnIn={pressOnIn}
      onPress={onPress}
      style={[
        styles.button,
        styles[size],
        styles[buttonVariant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : leadingContent ? (
        leadingContent
      ) : Icon ? (
        <Icon size={variant === 'icon' ? 19 : buttonIconSize} color={iconColor} />
      ) : null}
      {label ? (
        <Text numberOfLines={2} style={[styles.label, styles[`${buttonVariant}Label`], styles[`${size}Label`], isDisabled && styles.disabledLabel, labelStyle]}>
          {label}
        </Text>
      ) : null}
      {TrailingIcon && !loading ? <TrailingIcon size={buttonIconSize} color={iconColor} /> : null}
    </AnimatedPressable>
  );
}

const useStyles = createThemedStyles((theme) => {
  const roles = createMemopalColorRoles(theme);
  return StyleSheet.create({
      button: {
        minHeight: appLayout.controlHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: appSpacing.sm,
        borderRadius: appRadii.control,
        paddingHorizontal: appSpacing.lg,
        paddingVertical: appSpacing.sm,
      },
      primary: { backgroundColor: roles.action, borderBottomWidth: appLayout.buttonDepth, borderColor: roles.actionOutline },
      secondary: { backgroundColor: theme.paper, borderColor: roles.actionOutline, borderWidth: appLayout.borderWidth },
      tertiary: { backgroundColor: 'transparent' },
      destructive: { backgroundColor: roles.destructive },
      icon: {
        width: appLayout.touchTarget,
        height: appLayout.touchTarget,
        minHeight: appLayout.touchTarget,
        paddingHorizontal: 0,
        borderRadius: appRadii.control,
        backgroundColor: roles.actionSurface,
        borderColor: roles.actionOutline,
        borderWidth: 1.5,
      },
      compact: { minHeight: appLayout.compactControlHeight, paddingHorizontal: appSpacing.md },
      regular: { minHeight: appLayout.controlHeight, paddingHorizontal: appSpacing.lg },
      large: { minHeight: appLayout.controlHeight, paddingHorizontal: appSpacing.xl },
      fullWidth: { alignSelf: 'stretch' },
      disabled: { backgroundColor: roles.actionDisabled, borderColor: roles.border },
      label: { ...appTextStyles.button, flexShrink: 1, textAlign: 'center' },
      primaryLabel: { color: roles.actionOn },
      secondaryLabel: { color: roles.actionOnSurface },
      tertiaryLabel: { color: roles.actionOnSurface },
      destructiveLabel: { color: roles.destructiveOn },
      iconLabel: { color: roles.actionOnSurface },
      compactLabel: appTextStyles.buttonCompact,
      regularLabel: appTextStyles.button,
      largeLabel: appTextStyles.button,
      disabledLabel: { color: roles.actionOnDisabled },
  });
});
