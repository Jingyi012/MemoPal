import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

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
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      className={className}
      style={[style, animatedStyle]}
      onPressIn={() => {
        scale.value = withSpring(0.96, { stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
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
