import { useEffect, useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';
import { swimAtlasFrameAtPhase } from './swimAnimation';

export type MomoSwimMode = 'x';

const portrait = require('../../../../assets/images/momo-levels/level-03-v2.png');
const swimAtlas = require('../../../../assets/images/momo-swim-prototype/lv3-swim-atlas.png');
/** Lv3 swim prototype using a pre-rendered 64-frame atlas. */
export function MomoSwimPrototype({ size, active, cycleMs, onReady }: {
  size: number;
  active: boolean;
  cycleMs: number;
  onReady: () => void;
}) {
  const phase = useSharedValue(0);
  const ready = useSharedValue(0);
  const cycleDuration = useSharedValue(cycleMs);
  const loaded = useRef(new Set<string>());

  useEffect(() => {
    cycleDuration.value = cycleMs;
  }, [cycleDuration, cycleMs]);

  const swimClock = useFrameCallback((frame) => {
    // Keep the wing phase when an interaction pauses swimming or its speed changes.
    // A resumed frame can report a long gap; never fast-forward through that gap.
    const elapsed = frame.timeSincePreviousFrame ?? 0;
    // Never fast-forward through a long slow/resume frame. Capping the delta
    // keeps 30 FPS devices moving while limiting pose jumps after a stall.
    if (elapsed > 0) phase.value = (phase.value + Math.min(elapsed, 34) / cycleDuration.value) % 1;
  }, false);

  useEffect(() => {
    swimClock.setActive(active);
    return () => swimClock.setActive(false);
  }, [active, swimClock]);

  const markLoaded = (part: string) => {
    if (loaded.current.has(part)) return;
    loaded.current.add(part);
    if (loaded.current.size === 1) {
      ready.value = withTiming(1, { duration: 140 });
      onReady();
    }
  };
  const fallbackStyle = useAnimatedStyle(() => ({ opacity: 1 - ready.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: ready.value }));
  const swimBodyStyle = useAnimatedStyle(() => {
    const beat = phase.value * Math.PI * 2;
    return { transform: [
      // The atlas already contains the full wing/body wave. Keep only a tiny
      // buoyant drift here so a second squash animation cannot distort it.
      { translateY: Math.sin(beat) * size * .002 },
    ] };
  }, [size]);
  const atlasStyle = useAnimatedStyle(() => {
    const frame = swimAtlasFrameAtPhase(phase.value);
    const page = Math.floor(frame / 16);
    const slot = frame % 16;
    const column = page % 2 * 4 + slot % 4;
    const row = Math.floor(page / 2) * 4 + Math.floor(slot / 4);
    return { transform: [
      { translateX: -column * size },
      { translateY: -row * size },
    ] };
  }, [size]);
  return <Animated.View style={[{ width: size, height: size }, swimBodyStyle]} pointerEvents="none">
    <Animated.View style={[StyleSheet.absoluteFill, fallbackStyle]}>
      <Image source={portrait} resizeMode="contain" resizeMethod="resize" style={styles.fill} />
    </Animated.View>
    <Animated.View style={[styles.clip, { width: size, height: size }, contentStyle]}>
      <Animated.Image source={swimAtlas} onLoad={() => markLoaded('atlas')} resizeMode="stretch" resizeMethod="resize"
        style={[{ width: size * 8, height: size * 8 }, atlasStyle]} />
    </Animated.View>
  </Animated.View>;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  clip: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
});
