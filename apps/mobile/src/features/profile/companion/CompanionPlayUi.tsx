import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { GameButton } from '../components/GameButton';
import { CompanionActor } from './CompanionActor';
import type { CompanionCue } from './behavior';

export function GameMomo({ stage, cue, active, x = 0, y = 0, size = 132, label, celebrating = false }: {
  stage: number; cue: CompanionCue; active: boolean; x?: number; y?: number; size?: number; label: string; celebrating?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const { theme } = useStyles();
  const moveX = useSharedValue(x);
  const moveY = useSharedValue(y);
  const emote = useSharedValue(0);
  useEffect(() => {
    if (!active) { cancelAnimation(moveX); cancelAnimation(moveY); return; }
    moveX.value = withTiming(x, { duration: reduceMotion ? 0 : 420 });
    moveY.value = withTiming(y, { duration: reduceMotion ? 0 : 420 });
  }, [active, x, y, reduceMotion, moveX, moveY]);
  useEffect(() => {
    if (!active) { cancelAnimation(emote); emote.value = 0; return; }
    if (cue.action !== 'correct' && cue.action !== 'encourage' && cue.action !== 'celebrate') return;
    emote.value = 1;
    emote.value = withDelay(800, withTiming(0, { duration: reduceMotion ? 0 : 250 }));
    return () => cancelAnimation(emote);
  }, [active, cue.action, cue.sequence, emote, reduceMotion]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: moveX.value }, { translateY: moveY.value }] }));
  const emoteMotion = useAnimatedStyle(() => ({ opacity: emote.value,
    transform: [{ scale: reduceMotion ? 1 : .8 + emote.value * .2 }] }));
  return <Animated.View pointerEvents="none" style={[styles.momo, { marginLeft: -size / 2, marginTop: -size / 2 }, motion]}>
    <CompanionActor size={size} stage={stage} cue={cue} label={label}
      stablePresentation stableReactions holdReaction={celebrating} />
    <Animated.View style={[styles.emote, { backgroundColor: theme.paper }, emoteMotion]}>
      <Text style={styles.emoteText}>{cue.action === 'celebrate' ? '💖' : cue.action === 'encourage' ? '✦' : '✨'}</Text>
    </Animated.View>
  </Animated.View>;
}

export function GameOverlay({ title, detail, primary, onPrimary, secondary, onSecondary, count }: {
  title?: string; detail?: string; primary?: string; onPrimary?: () => void;
  secondary?: string; onSecondary?: () => void; count?: number;
}) {
  const { styles: themed } = useStyles();
  return <View style={themed.overlay} accessibilityLiveRegion="polite">
    <View pointerEvents="none" style={themed.veil} />
    <View style={[themed.center, count === undefined && themed.menuCenter]}>
      {count !== undefined ? <Text style={themed.count}>{count}</Text> : null}
      {title ? <Text style={themed.title}>{title}</Text> : null}
      {detail ? <Text style={themed.detail}>{detail}</Text> : null}
      {primary && onPrimary ? <View style={themed.button}><GameButton label={primary} onPress={onPrimary} /></View> : null}
      {secondary && onSecondary ? <View style={themed.button}><GameButton label={secondary} onPress={onSecondary} variant="secondary" /></View> : null}
    </View>
  </View>;
}

export function GameComboGlow({ active }: { active: boolean }) {
  const { theme } = useStyles();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(opacity);
    if (!active) { opacity.value = 0; return; }
    if (reduceMotion) { opacity.value = .55; return; }
    opacity.value = withRepeat(withSequence(
      withTiming(.8, { duration: 480 }), withTiming(.25, { duration: 480 }),
    ), -1, false);
    return () => cancelAnimation(opacity);
  }, [active, reduceMotion, opacity]);
  const motion = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none"
    style={[styles.comboGlow, { borderColor: theme.sun }, motion]} />;
}

export function GameBurst({ id, x, y, active, streak = 0 }: {
  id: number; x: number; y: number; active: boolean; streak?: number;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    if (active && !reduceMotion) progress.value = withTiming(1, { duration: 560 });
    return () => cancelAnimation(progress);
  }, [id, active, reduceMotion, progress]);
  return <View pointerEvents="none" style={[styles.burst, { left: x, top: y }]}>
    {(reduceMotion ? [0] : [0, 1, 2, 3, 4]).map(index =>
      <BurstDot key={index} index={index} progress={progress} intense={streak >= 5} />)}
  </View>;
}

function BurstDot({ index, progress, intense }: {
  index: number; progress: SharedValue<number>; intense: boolean;
}) {
  const { theme } = useStyles();
  const angle = index * Math.PI * 2 / 5;
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * (intense ? 58 : 42) * progress.value },
      { translateY: Math.sin(angle) * (intense ? 58 : 42) * progress.value },
      { scale: (intense ? 1.45 : 1) * (1 - .5 * progress.value) },
    ],
  }));
  return <Animated.View style={[styles.burstDot,
    { backgroundColor: intense ? theme.sun : index % 2 ? theme.sun : theme.paper }, motion]} />;
}

const styles = StyleSheet.create({
  momo: { position: 'absolute', left: '50%', top: '50%', zIndex: 1 },
  emote: { position: 'absolute', right: -12, top: -15, width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center' },
  emoteText: { fontSize: 25 },
  burst: { position: 'absolute', width: 12, height: 12, zIndex: 5 },
  burstDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  comboGlow: { ...StyleSheet.absoluteFillObject, borderWidth: 8, borderRadius: 28, zIndex: 2 },
});
const useStyles = createThemedStyles(theme => StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    // Keep the reef legible behind the short ready/result overlay instead of
    // washing the whole play area into a pale sheet.
    veil: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.skyTint, opacity: .2 },
    center: { width: '100%', maxWidth: 300, alignItems: 'center', gap: 12 },
    menuCenter: { marginTop: 48 },
    count: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 92, lineHeight: 112 },
    title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 30, textAlign: 'center' },
    detail: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 19, textAlign: 'center' },
    button: { width: '100%', marginTop: 4 },
}));
