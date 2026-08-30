import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Defs, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
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
      <Svg
        pointerEvents="none"
        style={styles.glowLayer}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="nightEmphasisGlow" cx="88%" cy="10%" r="80%">
            <Stop offset="0" stopColor="#FFC93C" stopOpacity="0.34" />
            <Stop offset="0.34" stopColor="#FFC93C" stopOpacity="0.2" />
            <Stop offset="0.7" stopColor="#FFC93C" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#FFC93C" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#nightEmphasisGlow)" />
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
  glowLayer: { ...StyleSheet.absoluteFillObject },
});
