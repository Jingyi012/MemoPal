import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const PressableBase = cssInterop(Pressable, {
  className: 'style',
});

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  className?: string;
  /** Trigger the action on touch-down for controls that must work above the keyboard. */
  pressOnIn?: boolean;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  containerStyle,
  onPress,
  pressOnIn = false,
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
  const firePress = (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    onPress?.(event);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <PressableBase
        {...rest}
        {...classNameProps}
        accessibilityRole={accessibilityRole}
        style={style}
        onPressIn={(e) => {
          if (!reduceMotion) scale.value = withSpring(0.96, { stiffness: 300 });
          if (pressOnIn) firePress(e);
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1);
        }}
        onPress={(e) => {
          if (!pressOnIn) firePress(e);
        }}>
        {children}
      </PressableBase>
    </Animated.View>
  );
};

export default AnimatedPressable;
