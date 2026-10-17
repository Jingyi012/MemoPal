import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
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
  /** Gentle card arrival and tactile tilt, respecting reduced motion. */
  lively?: boolean;
}

const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  containerStyle,
  onPress,
  pressOnIn = false,
  lively = false,
  className,
  accessibilityRole = 'button',
  ...rest
}) => {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const arrival = useSharedValue(lively && !reduceMotion ? 0 : 1);
  useEffect(() => {
    arrival.value = reduceMotion || !lively ? 1 : withTiming(1, { duration: 320 });
  }, [arrival, lively, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: lively ? arrival.value : 1,
    transform: [
      { translateY: lively && !reduceMotion ? (1 - arrival.value) * 10 : 0 },
      { scale: reduceMotion ? 1 : scale.value },
      { rotate: `${lively && !reduceMotion ? (1 - scale.value) * -20 : 0}deg` },
    ],
  }));
  const classNameProps = className ? { className } : {};
  const wrapperLayout = { ...(StyleSheet.flatten(containerStyle) ?? {}) };
  const pressableLayout = StyleSheet.flatten(style) ?? {};
  for (const key of [
    'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
    'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'position',
    'top', 'right', 'bottom', 'left',
  ] as const) {
    if (wrapperLayout[key] == null && pressableLayout[key] != null) {
      Object.assign(wrapperLayout, { [key]: pressableLayout[key] });
    }
  }
  const firePress = (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    onPress?.(event);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View style={[wrapperLayout, animatedStyle]}>
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
