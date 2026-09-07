import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Circle, Defs, Path, RadialGradient, Stop, Svg } from 'react-native-svg';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type NightEmphasisCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Shared dark emphasis surface used for the primary summary card on top-level screens. */
export function NightEmphasisCard({ children, style }: NightEmphasisCardProps) {
  return (
    <LinearGradient
      colors={[theme.night, theme.nightDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}>
      <Svg accessible={false} pointerEvents="none" style={styles.glowLayer} viewBox="0 0 220 220">
        <Defs>
          <RadialGradient id="nightEmphasisGlow" cx={140} cy={110} r={110} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC93C" stopOpacity="0.3" />
            <Stop offset="0.35" stopColor="#FFC93C" stopOpacity="0.2" />
            <Stop offset="0.7" stopColor="#FFC93C" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={110} fill="url(#nightEmphasisGlow)" />
        <Circle cx={155} cy={100} r={56} fill="none" stroke={theme.violet} strokeOpacity={0.28} strokeWidth={1} />
        <Circle cx={155} cy={100} r={78} fill="none" stroke={theme.violet} strokeOpacity={0.16} strokeWidth={1} />
        <Circle cx={105} cy={75} r={5} fill={theme.berry} />
        <Circle cx={187} cy={146} r={3} fill={theme.sun} />
        <Path d="M150 39 L153 47 L161 50 L153 53 L150 61 L147 53 L139 50 L147 47 Z" fill={theme.sun} />
      </Svg>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#51456D',
    boxShadow: '0px 6px 0px rgba(43,42,61,0.12)',
  },
  glowLayer: {
    position: 'absolute',
    width: 220,
    height: 220,
    top: -30,
    right: -65,
  },
});
