import { cn } from '@/utils/cn';
import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';
import { appShadows } from '@/theme/designSystem';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';
type CardRadius = 'lg' | 'xl' | '2xl' | '3xl';
type CardShadow = 'none' | 'sm' | 'md';

interface BaseCardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  padding?: CardPadding;
  radius?: CardRadius;
  shadow?: CardShadow;
  bordered?: boolean;
}

const CARD_PADDING_CLASS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const CARD_RADIUS_CLASS: Record<CardRadius, string> = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

const CARD_SHADOW_CLASS: Record<CardShadow, string> = {
  none: '',
  sm: '',
  md: '',
};

const CARD_SHADOW_STYLE: Record<CardShadow, ViewStyle | undefined> = {
  none: undefined,
  sm: appShadows.card,
  md: appShadows.raised,
};

export const CARD_SURFACE_CLASS = 'bg-surface';

export function getBaseCardClassName({
  className,
  padding = 'md',
  radius = '3xl',
  shadow = 'sm',
  bordered = true,
}: {
  className?: string;
  padding?: CardPadding;
  radius?: CardRadius;
  shadow?: CardShadow;
  bordered?: boolean;
} = {}) {
  return cn(
    CARD_SURFACE_CLASS,
    CARD_PADDING_CLASS[padding],
    CARD_RADIUS_CLASS[radius],
    CARD_SHADOW_CLASS[shadow],
    bordered ? 'border border-line' : '',
    className
  );
}

export const BaseCard: React.FC<BaseCardProps> = ({
  className,
  children,
  padding = 'md',
  radius = '3xl',
  shadow = 'sm',
  bordered = true,
  style,
  ...props
}) => (
  <View
    className={getBaseCardClassName({
      className,
      padding,
      radius,
      shadow,
      bordered,
    })}
    style={[CARD_SHADOW_STYLE[shadow], style]}
    {...props}>
    {children}
  </View>
);
