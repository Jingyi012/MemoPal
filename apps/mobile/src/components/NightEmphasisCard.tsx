import { memopalTheme as theme } from '@/theme/memopalTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Circle, Defs, RadialGradient, Stop, Svg } from 'react-native-svg';
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
      <Svg pointerEvents="none" style={styles.glowLayer} viewBox="0 0 220 220">
        <Defs>
          <RadialGradient id="nightEmphasisGlow" cx={140} cy={110} r={110} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC93C" stopOpacity="0.3" />
            <Stop offset="0.35" stopColor="#FFC93C" stopOpacity="0.2" />
            <Stop offset="0.7" stopColor="#FFC93C" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={110} fill="url(#nightEmphasisGlow)" />
      </Svg>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 22,
    padding: 16,
    boxShadow: '0px 10px 24px rgba(43,42,61,0.28)',
  },
  glowLayer: {
    position: 'absolute',
    width: 220,
    height: 220,
    top: -110,
    right: -50,
  },
});
