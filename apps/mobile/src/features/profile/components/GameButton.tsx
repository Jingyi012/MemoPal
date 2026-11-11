import { AppText as Text } from '@/components/ui/AppText';
import { appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'quiet'; icon?: React.ReactNode; disabled?: boolean };

/** A raised game control. The face sinks toward its shadow on press. */
export function GameButton({ label, onPress, variant = 'primary', icon, disabled = false }: Props) {
  const { styles } = useStyles();
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: reduceMotion ? 0 : pressed.value * 4 }] }));
  return <View style={[styles.shell, styles[`${variant}Shell`]]}>
    <Animated.View style={[styles.face, styles[`${variant}Face`], motion, disabled && styles.disabledFace]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }} onPressIn={() => { pressed.value = withTiming(1, { duration: 80 }); }}
        onPressOut={() => { pressed.value = withTiming(0, { duration: 140 }); }} style={styles.pressable}>
        {icon}<Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.otherLabel]}>{label}</Text>
      </Pressable>
    </Animated.View>
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  shell: { minHeight: 56, borderRadius: appRadii.card, paddingBottom: 5 },
  primaryShell: { backgroundColor: theme.night }, secondaryShell: { backgroundColor: theme.violetLine }, quietShell: { backgroundColor: theme.line },
  face: { minHeight: 52, borderRadius: appRadii.card },
  disabledFace: { opacity: .5 },
  primaryFace: { backgroundColor: theme.violetDeep }, secondaryFace: { backgroundColor: theme.violetTint }, quietFace: { backgroundColor: theme.paper },
  pressable: { minHeight: 52, paddingHorizontal: appSpacing.xl, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 },
  label: { fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  primaryLabel: { color: theme.onAccent }, otherLabel: { color: theme.violetDeep },
}));
