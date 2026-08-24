import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = cssInterop(Animated.createAnimatedComponent(Pressable), {
  className: 'style',
});

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  onPress,
  className,
  accessibilityRole = 'button',
  ...rest
}) => {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      className={className}
      accessibilityRole={accessibilityRole}
      style={[style, animatedStyle]}
      onPressIn={() => {
        if (!reduceMotion) scale.value = withSpring(0.96, { stiffness: 300 });
      }}
      onPressOut={() => {
        if (!reduceMotion) scale.value = withSpring(1);
      }}
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}>
      {children}
    </AnimatedPressableBase>
  );
};

export default AnimatedPressable;
