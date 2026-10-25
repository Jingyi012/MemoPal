import { memo } from 'react';
import { Animated, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Svg, { Defs, Ellipse, Image as SvgImage, Mask, RadialGradient, Stop } from 'react-native-svg';
import { momoReactionForLevel } from '@/features/avatars/momoPortraits';

type Expression = 'hello' | 'encourage' | 'think' | 'celebrate';
const expressions: readonly Expression[] = ['hello', 'encourage', 'think', 'celebrate'];

function FaceLayer({ source, size, opacity, name }: {
  source: ImageSourcePropType;
  size: number;
  opacity: Animated.Value;
  name: Expression;
}) {
  const gradientId = `momo-face-gradient-${name}`;
  const maskId = `momo-face-mask-${name}`;
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={gradientId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor="white" stopOpacity="1" />
          <Stop offset="0.87" stopColor="white" stopOpacity="1" />
          <Stop offset="1" stopColor="white" stopOpacity="0" />
        </RadialGradient>
        <Mask id={maskId} x="0" y="0" width="100" height="100">
          <Ellipse cx="54" cy="46" rx="29" ry="23" fill={`url(#${gradientId})`} />
        </Mask>
      </Defs>
      <SvgImage href={source} x="0" y="0" width="100" height="100"
        preserveAspectRatio="xMidYMid meet" mask={`url(#${maskId})`} />
    </Svg>
  </Animated.View>;
}

/** Face-only overlays let the ray keep one continuous pair of wings. */
export const MomoFaceExpressions = memo(function MomoFaceExpressions({ size, opacity }: {
  size: number;
  opacity: Record<Expression, Animated.Value>;
}) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {expressions.map((name) => <FaceLayer key={name} name={name} size={size}
      source={momoReactionForLevel(3, name)} opacity={opacity[name]} />)}
  </View>;
});
