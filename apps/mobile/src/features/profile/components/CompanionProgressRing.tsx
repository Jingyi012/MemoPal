import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

export function CompanionProgressRing({ progress, level, label }: { progress: number; level: number; label: string }) {
  const { styles, theme } = useStyles();
  const value = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const circumference = 2 * Math.PI * 18;
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite"
    accessibilityValue={{ min: 0, max: 100, now: value }} style={styles.wrap}>
    <Svg width={48} height={48} style={StyleSheet.absoluteFill}>
      <Circle cx={24} cy={24} r={18} stroke={theme.violetLine} strokeWidth={5} fill="none" />
      <Circle cx={24} cy={24} r={18} stroke={theme.violetDeep} strokeWidth={5} fill="none"
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - value / 100)}
        strokeLinecap="round" rotation={-90} origin="24,24" />
    </Svg>
    <Text style={styles.level} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.75}>Lv{level}</Text>
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  wrap: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: theme.paper },
  level: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, textAlign: 'center', width: 36 },
}));
