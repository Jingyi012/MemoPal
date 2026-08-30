import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

const PressableBase = cssInterop(Pressable, {
  className: 'style',
});

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  containerStyle,
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
  const classNameProps = className ? { className } : {};

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <PressableBase
        {...rest}
        {...classNameProps}
        accessibilityRole={accessibilityRole}
        style={style}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.96, { stiffness: 300 });
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1);
        }}
        onPress={(e) => {
          onPress?.(e);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}>
        {children}
      </PressableBase>
    </Animated.View>
  );
};

export default AnimatedPressable;
