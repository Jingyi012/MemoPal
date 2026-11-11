import { AppText as Text } from '@/components/ui/AppText';
import { appArtworkSizes, appArtworkTextStyles, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import type { PegSceneRecipe } from '@/features/memory-sets';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import {
  getBoosterPresentation,
  getMovieChoreography,
} from '@/features/number-peg/utils/numberPegMovie';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type NumberPegMovieStageProps = {
  pegNumber: number;
  pegImage: string;
  pegKeyword: string;
  targetLabel: string;
  recipe: PegSceneRecipe;
  playSignal: number;
  reducedMotion: boolean;
  compact?: boolean;
  hideTarget?: boolean;
};

export function NumberPegMovieStage({
  pegNumber,
  pegImage,
  pegKeyword,
  targetLabel,
  recipe,
  playSignal,
  reducedMotion,
  compact = false,
  hideTarget = false,
}: NumberPegMovieStageProps) {
  const choreography = useMemo(
    () => getMovieChoreography(recipe.actionPreset),
    [recipe.actionPreset]
  );
  const booster = getBoosterPresentation(recipe.sensoryBoosters[0]);
  const progress = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const lastPlayedSignal = useRef(0);

  useEffect(() => {
    progress.stopAnimation();
    glow.stopAnimation();
    progress.setValue(0);
    glow.setValue(0);
  }, [choreography, glow, progress, recipe.caption]);

  useEffect(() => {
    if (playSignal <= 0 || playSignal === lastPlayedSignal.current) return;
    lastPlayedSignal.current = playSignal;
    progress.stopAnimation();
    glow.stopAnimation();

    if (reducedMotion) {
      progress.setValue(0);
      glow.setValue(0);
      return;
    }

    progress.setValue(0);
    glow.setValue(0);
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: compact ? 1450 : 1350,
        easing: Easing.bezier(0.22, 0.72, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(380),
        Animated.timing(glow, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 560,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [compact, glow, playSignal, progress, reducedMotion]);

  const isSpin = recipe.actionPreset === 'spin';
  const isLaunch = recipe.actionPreset === 'launch';
  const isExplode = recipe.actionPreset === 'explode';
  const motionScale = compact ? 0.72 : 1;

  const anim = useMemo(() => {
    const pegX = progress.interpolate({
      inputRange: [0, 0.18, 0.5, 0.7, 1],
      outputRange: [
        0,
        choreography.pegFromX * motionScale,
        choreography.pegToX * motionScale,
        (choreography.pegToX - 5) * motionScale,
        0,
      ],
    });
    const pegY = progress.interpolate({
      inputRange: [0, 0.18, 0.5, 0.72, 1],
      outputRange: [
        0,
        choreography.pegFromY * motionScale,
        choreography.pegToY * motionScale,
        -5 * motionScale,
        0,
      ],
    });
    const pegScale = progress.interpolate({
      inputRange: [0, 0.18, 0.48, 0.62, 1],
      outputRange: [
        1,
        choreography.pegFromScale,
        choreography.pegToScale,
        choreography.pegToScale * 1.08,
        1,
      ],
    });
    const targetX = progress.interpolate({
      inputRange: [0, 0.18, 0.5, 0.72, 1],
      outputRange: [
        0,
        choreography.targetFromX * motionScale,
        choreography.targetToX * motionScale,
        (choreography.targetToX + 7) * motionScale,
        0,
      ],
    });
    const targetY = progress.interpolate({
      inputRange: [0, 0.18, 0.52, 0.78, 1],
      outputRange: [
        0,
        choreography.targetFromY * motionScale,
        choreography.targetToY * motionScale,
        (isLaunch ? -18 : choreography.targetToY * 0.3) * motionScale,
        0,
      ],
    });
    const targetScale = progress.interpolate({
      inputRange: [0, 0.18, 0.48, 0.66, 1],
      outputRange: [
        1,
        choreography.targetFromScale,
        choreography.targetToScale,
        isExplode ? 1.34 : choreography.targetToScale * 1.05,
        1,
      ],
    });
    const pegRotate = progress.interpolate({
      inputRange: [0, 0.18, 0.55, 1],
      outputRange: isSpin
        ? ['0deg', '-12deg', '350deg', '720deg']
        : ['0deg', '-7deg', '7deg', '0deg'],
    });
    const targetRotate = progress.interpolate({
      inputRange: [0, 0.18, 0.55, 1],
      outputRange: isSpin
        ? ['0deg', '8deg', '-330deg', '-720deg']
        : ['0deg', '6deg', '-8deg', '0deg'],
    });
    const effectOpacity = progress.interpolate({
      inputRange: [0, 0.3, 0.48, 0.72, 1],
      outputRange: [0, 0, 1, 0.62, 0],
    });
    const effectScale = progress.interpolate({
      inputRange: [0, 0.34, 0.52, 0.76, 1],
      outputRange: [0.18, 0.3, 1.42, 1.85, 2.08],
    });
    const particleOpacity = progress.interpolate({
      inputRange: [0, 0.38, 0.55, 0.86, 1],
      outputRange: [0, 0, 1, 0.55, 0],
    });
    const particleLeftX = progress.interpolate({
      inputRange: [0, 0.42, 0.72, 1],
      outputRange: [0, 0, -34, -50],
    });
    const particleRightX = progress.interpolate({
      inputRange: [0, 0.42, 0.72, 1],
      outputRange: [0, 0, 34, 50],
    });
    const particleY = progress.interpolate({
      inputRange: [0, 0.42, 0.72, 1],
      outputRange: [0, 0, -19, -28],
    });

    return {
      pegX,
      pegY,
      pegScale,
      targetX,
      targetY,
      targetScale,
      pegRotate,
      targetRotate,
      effectOpacity,
      effectScale,
      particleOpacity,
      particleLeftX,
      particleRightX,
      particleY,
    };
  }, [progress, choreography, isSpin, isLaunch, isExplode, motionScale]);

  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.45] });

  const targetValue = hideTarget ? '?' : recipe.targetVisual?.value || targetLabel;
  const targetIsImage = !hideTarget && recipe.targetVisual?.kind === 'emoji';

  // Precompute the font size in plain JS instead of using adjustsFontSizeToFit, which
  // forces a synchronous native text remeasure. That remeasure landing right as the
  // entrance transform kicks off is a common source of a visible first-play hitch,
  // especially on Android.
  const targetFontSize = targetIsImage
    ? undefined
    : targetValue.length > 10 ? appTextStyles.body.fontSize
      : targetValue.length > 6 ? appTextStyles.sectionTitle.fontSize : appTextStyles.screenTitle.fontSize;
  const targetFontSizeCompact = targetIsImage
    ? undefined
    : targetValue.length > 10 ? appTextStyles.caption.fontSize
      : targetValue.length > 6 ? appTextStyles.label.fontSize : appTextStyles.cardTitle.fontSize;

  return (
    <View
      accessible
      accessibilityLabel={
        hideTarget ? `${pegNumber} ${pegKeyword}` : `${pegNumber} ${pegKeyword}. ${recipe.caption}`
      }
      style={[styles.stage, compact && styles.stageCompact]}>
      <LinearGradient
        colors={[booster.tint, '#FFFCF4', '#F3EFFF']}
        start={{ x: 0.08, y: 0.08 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.floor} />
      <Animated.View style={[styles.glow, { opacity: glow, transform: [{ scale: glowScale }] }]} />

      <Animated.View
        style={[
          styles.peg,
          compact && styles.pegCompact,
          {
            transform: [
              { translateX: anim.pegX },
              { translateY: anim.pegY },
              { rotate: anim.pegRotate },
              { scale: anim.pegScale },
            ],
          },
        ]}>
        <Text style={[styles.pegEmoji, compact && styles.pegEmojiCompact]}>{pegImage}</Text>
        <View style={styles.pegBadge}>
          <Text style={styles.pegNumber}>{pegNumber}</Text>
        </View>
        <Text numberOfLines={1} style={styles.pegName}>
          {pegKeyword}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.effect,
          { opacity: anim.effectOpacity, transform: [{ scale: anim.effectScale }] },
        ]}>
        <Text style={[styles.effectEmoji, compact && styles.effectEmojiCompact]}>
          {choreography.effectEmoji}
        </Text>
        {recipe.sensoryBoosters[0] ? (
          <Text style={[styles.boosterEmoji, compact && styles.boosterEmojiCompact]}>
            {booster.emoji}
          </Text>
        ) : null}
      </Animated.View>

      {[-1, 1].map((direction) => (
        <Animated.View
          key={direction}
          style={[
            styles.particle,
            {
              opacity: anim.particleOpacity,
              transform: [
                { translateX: direction < 0 ? anim.particleLeftX : anim.particleRightX },
                { translateY: anim.particleY },
                { rotate: direction < 0 ? '-24deg' : '24deg' },
              ],
            },
          ]}>
          <Text style={styles.particleText}>{direction < 0 ? '✦' : '●'}</Text>
        </Animated.View>
      ))}

      <Animated.View
        style={[
          styles.target,
          compact && styles.targetCompact,
          {
            transform: [
              { translateX: anim.targetX },
              { translateY: anim.targetY },
              { rotate: anim.targetRotate },
              { scale: anim.targetScale },
            ],
          },
        ]}>
        <Text
          numberOfLines={2}
          style={[
            targetIsImage ? styles.targetEmoji : styles.targetText,
            compact && (targetIsImage ? styles.targetEmojiCompact : styles.targetTextCompact),
            !compact && targetFontSize ? { fontSize: targetFontSize } : null,
            compact && targetFontSizeCompact ? { fontSize: targetFontSizeCompact } : null,
          ]}>
          {targetValue}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    minHeight: 204,
    borderRadius: appRadii.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: appSpacing.xs,
    overflow: 'hidden',
    paddingHorizontal: appSpacing.md,
    position: 'relative',
  },
  stageCompact: { minHeight: 150, borderRadius: appRadii.control },
  floor: {
    position: 'absolute',
    width: '72%',
    height: 20,
    borderRadius: appRadii.pill,
    backgroundColor: 'rgba(62,55,88,0.08)',
    bottom: 22,
    transform: [{ scaleX: 1.12 }],
  },
  glow: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(255,199,60,0.33)',
    left: '50%',
    marginLeft: -59,
  },
  peg: {
    width: 104,
    height: 112,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 2,
    borderColor: '#FFD9E2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pegCompact: { width: 84, height: 92, borderRadius: appRadii.hero },
  pegEmoji: appArtworkTextStyles.large,
  pegEmojiCompact: appArtworkTextStyles.medium,
  pegBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    minWidth: 24,
    height: 24,
    borderRadius: appRadii.control,
    backgroundColor: theme.berry,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pegNumber: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  pegName: {
    color: theme.berryDeep,
    fontFamily: typography.bodyExtraBold,
    fontSize: appTextStyles.caption.fontSize,
    maxWidth: 80,
    textTransform: 'uppercase',
  },
  effect: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  effectEmoji: { fontSize: appArtworkSizes.medium },
  effectEmojiCompact: { fontSize: appArtworkSizes.small },
  boosterEmoji: { fontSize: appArtworkSizes.tiny, marginTop: -6 },
  boosterEmojiCompact: { fontSize: appTextStyles.cardTitle.fontSize },
  particle: {
    position: 'absolute',
    zIndex: 4,
    left: '50%',
    top: '45%',
    pointerEvents: 'none',
  },
  particleText: { color: theme.sunDeep, fontSize: appTextStyles.sectionTitle.fontSize },
  target: {
    minWidth: 108,
    maxWidth: 138,
    minHeight: 90,
    borderRadius: 25,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: '#29263F',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  targetCompact: { minWidth: 88, maxWidth: 112, minHeight: 72, borderRadius: appRadii.card },
  targetText: {
    color: 'white',
    fontFamily: typography.display,
    fontSize: appTextStyles.screenTitle.fontSize,
    textAlign: 'center',
  },
  targetTextCompact: { fontSize: appTextStyles.cardTitle.fontSize },
  targetEmoji: { fontSize: appArtworkSizes.large },
  targetEmojiCompact: { fontSize: appArtworkSizes.medium },
});
