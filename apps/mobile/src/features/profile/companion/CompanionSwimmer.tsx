import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { CompanionActor } from './CompanionActor';
import { ACTION_DURATION, type CompanionCue } from './behavior';
import type { MomoSwimMode } from './MomoSwimPrototype';
import { sampleSwimCurve } from './swimAnimation';

type Props = {
  active: boolean;
  reduceMotion: boolean;
  cue: CompanionCue;
  stage: number;
  size: number;
  tankWidth: number;
  tankHeight: number;
  label: string;
  hint: string;
  onPress: () => void;
  onLongPress?: () => void;
  onPressOut?: () => void;
  slow?: boolean;
  swimPrototype?: MomoSwimMode;
  stablePresentation?: boolean;
  faceReactions?: boolean;
};

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

/** Momo chooses new destinations as it swims; there is no repeating route. */
export function CompanionSwimmer({ active, reduceMotion, cue, stage, size, tankWidth, tankHeight, label, hint, onPress, onLongPress, onPressOut, slow = false, swimPrototype, stablePresentation = false, faceReactions = false }: Props) {
  const traveling = active && cue.action === 'idle';
  const position = useRef(new Animated.ValueXY()).current;
  const bank = useRef(new Animated.Value(0)).current;
  const travelDirection = useRef(1);
  const tilt = useRef(new Animated.Value(0)).current;
  const arc = useRef(new Animated.Value(0)).current;
  const current = useRef({ x: 0, y: 0 });
  const holdUntil = useRef(0);
  const growth = Number.isFinite(stage) ? Math.max(0, Math.min(1, (stage - 1) / 9)) : 0;
  const travelRange = .65 + growth * .35;
  const rangeX = Math.max(0, Math.min(175, (tankWidth - size) / 2 - 14)) * travelRange;
  const rangeY = Math.max(0, (tankHeight - size) / 2 - 16) * travelRange;

  useEffect(() => {
    if (cue.action !== 'idle') holdUntil.current = Date.now() + ACTION_DURATION[cue.action];
  }, [cue.action, cue.sequence]);

  useEffect(() => {
    if (!reduceMotion) return;
    const settle = Animated.parallel([
      Animated.timing(bank, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(tilt, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(arc, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    settle.start();
    return () => settle.stop();
  }, [reduceMotion, bank, tilt, arc]);

  useEffect(() => {
    if (!traveling || reduceMotion || (rangeX < 8 && rangeY < 8)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let motion: Animated.CompositeAnimation | undefined;

    const swim = () => {
      if (cancelled) return;
      const waitForReaction = holdUntil.current - Date.now();
      if (waitForReaction > 0) {
        timer = setTimeout(swim, waitForReaction);
        return;
      }

      const from = current.current;
      let target = from;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const horizontalStep = (30 + Math.random() * rangeX * .9) * travelDirection.current;
        target = {
          x: clamp(from.x + horizontalStep, rangeX),
          y: clamp(from.y + (Math.random() - .5) * rangeY * 1.1, rangeY),
        };
        if (Math.hypot(target.x - from.x, target.y - from.y) > Math.min(32, Math.max(rangeX, rangeY) * .45)) break;
      }
      if (Math.abs(target.x - from.x) < 12) {
        target = { ...target, x: clamp(from.x - travelDirection.current * Math.max(40, rangeX * .45), rangeX) };
      }
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) {
        timer = setTimeout(swim, 350);
        return;
      }
      const duration = (4000 + Math.random() * 4000) * (slow ? 1.35 : 1);
      const nextDirection = dx < -12 ? -1 : dx > 12 ? 1 : travelDirection.current;
      const turning = nextDirection !== travelDirection.current;
      travelDirection.current = nextDirection;
      const turn = Animated.sequence([
        Animated.timing(bank, { toValue: nextDirection * 12, duration: 170,
          easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bank, { toValue: 0, duration: 230,
          easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]);
      const swimMotion = Animated.parallel([
        Animated.sequence(sampleSwimCurve(from, target,
          (turning ? 1 : Math.random() < .5 ? -1 : 1) * Math.min(turning ? 58 : 32, distance * (turning ? .24 : .14)),
          12, { x: rangeX, y: rangeY })
          .slice(1).map((point, index, points) => Animated.parallel([
            Animated.timing(position.x, { toValue: point.x, duration: duration / points.length,
              easing: index === 0 ? Easing.in(Easing.quad) : index === points.length - 1 ? Easing.out(Easing.quad) : Easing.linear,
              useNativeDriver: true }),
            Animated.timing(position.y, { toValue: point.y, duration: duration / points.length,
              easing: index === 0 ? Easing.in(Easing.quad) : index === points.length - 1 ? Easing.out(Easing.quad) : Easing.linear,
              useNativeDriver: true }),
          ]))),
        Animated.sequence([
          Animated.timing(arc, { toValue: Math.min(12, distance * .08) * (Math.random() < .5 ? -1 : 1),
            duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(arc, { toValue: 0, duration: duration / 2,
            easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.timing(tilt, { toValue: clamp(dy / distance * 8, 8), duration: 600, useNativeDriver: true }),
      ]);
      motion = turning ? Animated.sequence([turn, swimMotion]) : swimMotion;
      motion.start(({ finished }) => {
        if (!finished || cancelled) return;
        current.current = target;
        const rest = Math.random() < .22 ? 650 + Math.random() * 1100 : 180 + Math.random() * 330;
        timer = setTimeout(swim, rest);
      });
    };

    timer = setTimeout(swim, 400);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      motion?.stop();
      position.stopAnimation((value) => { current.current = value; });
      bank.stopAnimation();
      tilt.stopAnimation();
      arc.stopAnimation();
    };
  }, [traveling, reduceMotion, rangeX, rangeY, position, bank, tilt, arc, slow]);

  return (
    <Animated.View style={[styles.swimmer, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      transform: [
        { translateX: position.x }, { translateY: Animated.add(position.y, arc) },
        { rotate: Animated.add(tilt, bank).interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'] }) },
      ],
    }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint}
        onPress={onPress} onLongPress={onLongPress} onPressOut={onPressOut} delayLongPress={420} style={styles.tapTarget}>
        <CompanionActor size={size} cue={cue} stage={stage} label={label}
          swimPrototype={swimPrototype} swimActive={active && !reduceMotion} swimSlow={slow}
          stablePresentation={stablePresentation} faceReactions={faceReactions} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  swimmer: { position: 'absolute', left: '50%', top: '50%', zIndex: 1 },
  tapTarget: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
});
