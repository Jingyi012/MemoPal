import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useCompanionActive } from './useCompanionActive';
import { ACTION_DURATION, type CompanionAction, type CompanionCue } from './behavior';
import { momoGrowthScaleForLevel, momoPortraitForLevel, momoReactionForLevel, momoSwimWingForLevel } from '@/features/avatars/momoPortraits';

type Pose = 'idle' | 'wing' | 'hello' | 'correct' | 'encourage' | 'think' | 'celebrate';
type SpritePose = Exclude<Pose, 'correct'>;
const spritePoses: readonly SpritePose[] = ['idle', 'wing', 'hello', 'encourage', 'think', 'celebrate'];
const spritePose = (pose: Pose): SpritePose => pose === 'correct' ? 'celebrate' : pose;
const reactionPose: Record<CompanionAction, Pose> = {
  idle: 'idle', hello: 'hello', pet: 'hello', highFive: 'celebrate',
  dance: 'celebrate', correct: 'correct', encourage: 'encourage',
  celebrate: 'celebrate', think: 'think', hug: 'hello', chase: 'wing',
  yawn: 'think', peek: 'hello', spin: 'celebrate', rare: 'celebrate',
};

type PoseFrame = { at: number; pose: Pose };
const actionFrames: Partial<Record<CompanionAction, readonly PoseFrame[]>> = {
  hello: [{ at: 0, pose: 'idle' }, { at: 160, pose: 'wing' }, { at: 330, pose: 'hello' },
    { at: 570, pose: 'wing' }, { at: 760, pose: 'hello' }, { at: 1080, pose: 'wing' },
    { at: 1270, pose: 'hello' }],
  pet: [{ at: 0, pose: 'wing' }, { at: 290, pose: 'encourage' }, { at: 600, pose: 'hello' },
    { at: 910, pose: 'celebrate' }, { at: 1250, pose: 'wing' }, { at: 1510, pose: 'hello' }],
  highFive: [{ at: 0, pose: 'wing' }, { at: 270, pose: 'hello' }, { at: 470, pose: 'celebrate' },
    { at: 710, pose: 'wing' }, { at: 930, pose: 'celebrate' }, { at: 1210, pose: 'hello' }],
  dance: [{ at: 0, pose: 'wing' }, { at: 200, pose: 'hello' }, { at: 400, pose: 'wing' },
    { at: 600, pose: 'celebrate' }, { at: 800, pose: 'wing' }, { at: 1000, pose: 'hello' },
    { at: 1200, pose: 'wing' }, { at: 1400, pose: 'celebrate' }, { at: 1600, pose: 'wing' },
    { at: 1800, pose: 'hello' }, { at: 2000, pose: 'wing' }, { at: 2200, pose: 'celebrate' },
    { at: 2400, pose: 'wing' }, { at: 2600, pose: 'hello' }, { at: 2800, pose: 'wing' },
    { at: 3000, pose: 'celebrate' }],
  correct: [{ at: 0, pose: 'wing' }, { at: 180, pose: 'correct' }, { at: 400, pose: 'celebrate' },
    { at: 650, pose: 'wing' }, { at: 860, pose: 'correct' }],
  encourage: [{ at: 0, pose: 'think' }, { at: 350, pose: 'wing' }, { at: 620, pose: 'encourage' },
    { at: 1090, pose: 'wing' }, { at: 1350, pose: 'encourage' }],
  celebrate: [{ at: 0, pose: 'wing' }, { at: 170, pose: 'celebrate' }, { at: 470, pose: 'wing' },
    { at: 680, pose: 'celebrate' }, { at: 1020, pose: 'wing' }, { at: 1240, pose: 'celebrate' },
    { at: 1720, pose: 'wing' }, { at: 1940, pose: 'celebrate' }, { at: 2330, pose: 'hello' }],
  think: [{ at: 0, pose: 'think' }, { at: 510, pose: 'wing' }, { at: 690, pose: 'think' },
    { at: 1260, pose: 'hello' }, { at: 1450, pose: 'think' }],
  hug: [{ at: 0, pose: 'wing' }, { at: 280, pose: 'hello' }, { at: 870, pose: 'hello' }, { at: 1420, pose: 'wing' }],
  chase: [{ at: 0, pose: 'wing' }, { at: 350, pose: 'hello' }, { at: 720, pose: 'wing' }, { at: 1120, pose: 'celebrate' }],
  yawn: [{ at: 0, pose: 'idle' }, { at: 460, pose: 'think' }, { at: 1180, pose: 'think' }, { at: 1740, pose: 'idle' }],
  peek: [{ at: 0, pose: 'think' }, { at: 520, pose: 'wing' }, { at: 920, pose: 'hello' }, { at: 1480, pose: 'wing' }],
  spin: [{ at: 0, pose: 'wing' }, { at: 560, pose: 'celebrate' }, { at: 1140, pose: 'wing' }, { at: 1680, pose: 'hello' }],
  rare: [{ at: 0, pose: 'think' }, { at: 300, pose: 'celebrate' }, { at: 660, pose: 'wing' }, { at: 1050, pose: 'celebrate' }, { at: 1630, pose: 'hello' }],
};

type Motion = { x: number[]; y: number[]; angle: number[]; scale: number[] };
const motionTimes = [0, .2, .4, .6, .8, 1];
const actionMotion: Record<CompanionAction, Motion> = {
  idle: { x: [0, 0, 0, 0, 0, 0], y: [0, 0, 0, 0, 0, 0],
    angle: [0, 0, 0, 0, 0, 0], scale: [1, 1, 1, 1, 1, 1] },
  hello: { x: [0, -.12, .09, -.07, .04, 0], y: [0, -.08, -.15, -.06, -.11, 0],
    angle: [0, -19, 17, -16, 10, 0], scale: [1, 1.06, 1.13, 1.08, 1.07, 1] },
  pet: { x: [0, -.04, .04, -.02, .02, 0], y: [0, .09, -.04, -.1, -.02, 0],
    angle: [0, -13, 10, -9, 6, 0], scale: [1, 1.2, 1.34, 1.27, 1.13, 1] },
  highFive: { x: [0, -.17, -.06, .25, .13, 0], y: [0, .06, -.13, -.21, .06, 0],
    angle: [0, -22, -10, 30, 13, 0], scale: [1, .92, 1.16, 1.28, .91, 1] },
  dance: { x: [0, -.2, -.06, .2, .06, 0], y: [0, -.09, .04, -.09, .04, 0],
    angle: [0, -28, -8, 28, 8, 0], scale: [1, 1.12, .94, 1.12, .94, 1] },
  correct: { x: [0, -.07, .08, -.04, .03, 0], y: [0, -.21, .04, -.14, .02, 0],
    angle: [0, -18, 14, -12, 5, 0], scale: [1, 1.22, .91, 1.16, .97, 1] },
  encourage: { x: [0, -.1, .05, -.05, .03, 0], y: [0, .04, .08, -.04, 0, 0],
    angle: [0, -13, 8, -9, 4, 0], scale: [1, 1.05, 1.16, 1.23, 1.1, 1] },
  celebrate: { x: [0, -.13, .1, -.11, .08, 0], y: [0, -.24, .04, -.18, .03, 0],
    angle: [0, -25, 19, -20, 12, 0], scale: [1, 1.28, .92, 1.22, .95, 1] },
  think: { x: [0, -.08, -.13, .05, .08, 0], y: [0, -.02, -.07, -.08, -.04, 0],
    angle: [0, -10, -19, 7, 13, 0], scale: [1, 1.04, 1.07, 1.08, 1.04, 1] },
  hug: { x: [0, 0, 0, 0, 0, 0], y: [0, .08, .04, .04, .05, 0],
    angle: [0, -5, 4, -3, 2, 0], scale: [1, 1.13, 1.34, 1.27, 1.24, 1] },
  chase: { x: [0, -.22, -.08, .25, .12, 0], y: [0, -.11, -.2, -.09, .05, 0],
    angle: [0, -16, -6, 19, 8, 0], scale: [1, 1.07, 1.15, 1.07, .98, 1] },
  yawn: { x: [0, -.02, 0, .02, 0, 0], y: [0, .02, .07, .06, .02, 0],
    angle: [0, -4, -9, -8, -3, 0], scale: [1, .96, 1.08, 1.1, 1.02, 1] },
  peek: { x: [0, -.08, .08, .16, .1, 0], y: [0, -.04, -.1, -.08, -.03, 0],
    angle: [0, -10, 8, 12, 5, 0], scale: [1, 1.05, 1.18, 1.29, 1.13, 1] },
  spin: { x: [0, -.08, 0, .08, .02, 0], y: [0, -.14, -.05, -.15, -.06, 0],
    angle: [0, 80, 170, 260, 345, 360], scale: [1, 1.12, 1.03, 1.12, 1.05, 1] },
  rare: { x: [0, -.11, .1, -.08, .07, 0], y: [0, -.12, -.29, -.08, -.21, 0],
    angle: [0, -19, 20, -13, 14, 0], scale: [1, 1.15, 1.43, .94, 1.26, 1] },
};

export type CompanionActorProps = {
  size: number;
  cue?: CompanionCue;
  label?: string;
  stage?: number;
  stablePresentation?: boolean;
  stableReactions?: boolean;
  holdReaction?: boolean;
};

const ResidentSprites = memo(function ResidentSprites({ level, poseOpacity, onReady, stablePresentation, stableReactions }: {
  level: number;
  poseOpacity: Record<SpritePose, Animated.Value>;
  onReady: (pose: SpritePose) => void;
  stablePresentation: boolean;
  stableReactions: boolean;
}) {
  const sources = {
    idle: momoPortraitForLevel(level),
    wing: momoSwimWingForLevel(level),
    hello: momoReactionForLevel(level, 'hello'),
    encourage: momoReactionForLevel(level, 'encourage'),
    think: momoReactionForLevel(level, 'think'),
    celebrate: momoReactionForLevel(level, 'celebrate'),
  };
  if (stablePresentation && !stableReactions) {
    return <Animated.Image source={sources.idle} onLoad={() => onReady('idle')}
      resizeMode="contain" resizeMethod="resize" style={styles.sprite} />;
  }
  return spritePoses.filter((pose) => !stableReactions || pose !== 'wing').map((pose) =>
    <Animated.Image key={pose} source={sources[pose]}
        onLoad={() => onReady(pose)} resizeMode="contain" resizeMethod="resize"
        style={[styles.sprite, { opacity: poseOpacity[pose] }]} />);
});

/** Pre-rendered shaded poses keep Momo's face consistent without a native GL surface. */
export function CompanionActor({ size, cue, label, stage = 3, stablePresentation = false, stableReactions = false, holdReaction = false }: CompanionActorProps) {
  const active = useCompanionActive();
  const reduceMotion = useReducedMotion();
  const idle = useRef(new Animated.Value(0)).current;
  const reaction = useRef(new Animated.Value(0)).current;
  const poseOpacity = useRef<Record<SpritePose, Animated.Value>>({
    idle: new Animated.Value(1), wing: new Animated.Value(0),
    hello: new Animated.Value(0), encourage: new Animated.Value(0),
    think: new Animated.Value(0), celebrate: new Animated.Value(0),
  }).current;
  const poseHandoff = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef<Set<SpritePose>>(new Set());
  const visible = useRef<SpritePose>('idle');
  const pending = useRef<SpritePose | null>(null);
  const action = cue?.action ?? 'idle';
  const animateBody = active && !reduceMotion;
  const level = Number.isFinite(stage) ? Math.max(1, Math.min(10, Math.floor(stage))) : 1;

  const showPose = useCallback((pose: Pose) => {
    if (stablePresentation && !stableReactions) return;
    const next = stableReactions && pose === 'wing' ? 'idle' : spritePose(pose);
    // Bundled game reaction layers are mounted together. Android does not
    // consistently deliver onLoad for a layer initially hidden at opacity 0.
    if (!stableReactions && !loaded.current.has(next)) { pending.current = next; return; }
    pending.current = null;
    if (visible.current === next) return;
    visible.current = next;
    // Keep the outgoing decoded image visible until the incoming layer has
    // reached the native view. Switching all opacities in one JS tick left a
    // fully transparent frame on Android during the idle blink.
    if (poseHandoff.current) clearTimeout(poseHandoff.current);
    poseOpacity[next].setValue(1);
    poseHandoff.current = setTimeout(() => {
      spritePoses.forEach((pose) => {
        if (pose !== next) poseOpacity[pose].setValue(0);
      });
      poseHandoff.current = null;
    }, stableReactions ? 20 : 40);
  }, [poseOpacity, stablePresentation, stableReactions]);

  const onSpriteReady = useCallback((pose: SpritePose) => {
    loaded.current.add(pose);
    if (pending.current === pose) showPose(pose);
  }, [showPose]);

  useEffect(() => {
    loaded.current.clear();
    pending.current = null;
    visible.current = 'idle';
    if (poseHandoff.current) clearTimeout(poseHandoff.current);
    spritePoses.forEach((pose) => poseOpacity[pose].setValue(pose === 'idle' ? 1 : 0));
    return () => { if (poseHandoff.current) clearTimeout(poseHandoff.current); };
  }, [level, poseOpacity]);

  useEffect(() => {
    idle.stopAnimation();
    idle.setValue(0);
    if (!active || reduceMotion) return;
    const swim = Animated.loop(Animated.sequence([
      Animated.timing(idle, { toValue: 1, duration: 1250, useNativeDriver: true }),
      Animated.timing(idle, { toValue: 0, duration: 1350, useNativeDriver: true }),
    ]));
    swim.start();
    return () => swim.stop();
  }, [active, reduceMotion, idle]);

  useEffect(() => {
    if (!animateBody || action !== 'idle' || stablePresentation) return;
    let winkTimer: ReturnType<typeof setTimeout>;
    let resetTimer: ReturnType<typeof setTimeout>;
    const scheduleWink = () => {
      winkTimer = setTimeout(() => {
        showPose('hello');
        resetTimer = setTimeout(() => { showPose('idle'); scheduleWink(); }, 220);
      }, 4200 + Math.random() * 2400);
    };
    scheduleWink();
    return () => { clearTimeout(winkTimer); clearTimeout(resetTimer); };
  }, [animateBody, action, level, showPose, stablePresentation]);

  useEffect(() => {
    reaction.stopAnimation();
    reaction.setValue(0);
    if (action === 'idle') { showPose('idle'); return; }
    const frames = actionFrames[action] ?? [{ at: 0, pose: reactionPose[action] }];
    showPose(stableReactions ? reactionPose[action] : animateBody ? frames[0].pose : reactionPose[action]);
    const frameTimers = animateBody && !stablePresentation ? frames.slice(1).map((frame) =>
      setTimeout(() => showPose(frame.pose), frame.at)) : [];
    if (animateBody) {
      const motion = Animated.timing(reaction, { toValue: 1,
        duration: action === 'dance' ? 800 : ACTION_DURATION[action], useNativeDriver: true });
      (action === 'dance' ? Animated.loop(motion, { iterations: 4 }) : motion).start();
    }
    const timer = holdReaction ? null : setTimeout(() => showPose('idle'), ACTION_DURATION[action]);
    return () => {
      if (timer) clearTimeout(timer);
      frameTimers.forEach(clearTimeout);
      reaction.stopAnimation();
    };
  }, [action, animateBody, cue?.sequence, reaction, showPose, stablePresentation, stableReactions, holdReaction]);

  const motion = actionMotion[action];
  return (
    <Animated.View accessible accessibilityLabel={label} style={{ width: size, height: size, transform: [
      { translateY: Animated.add(
        idle.interpolate({ inputRange: [0, 1], outputRange: [0, animateBody ? -Math.min(12, size * .045) : 0] }),
        reaction.interpolate({ inputRange: motionTimes, outputRange: motion.y.map(value => value * size) }),
      ) },
      { translateX: reaction.interpolate({ inputRange: motionTimes, outputRange: motion.x.map(value => value * size) }) },
      { rotate: reaction.interpolate({ inputRange: motionTimes, outputRange: motion.angle.map(value => `${value}deg`) }) },
      { scale: reaction.interpolate({ inputRange: motionTimes, outputRange: motion.scale }) },
      { rotate: idle.interpolate({ inputRange: [0, 1], outputRange: ['0deg', stablePresentation && animateBody ? '1.8deg' : '0deg'] }) },
      { scale: momoGrowthScaleForLevel(level) },
    ] }}>
      <ResidentSprites level={level} poseOpacity={poseOpacity} onReady={onSpriteReady}
        stablePresentation={stablePresentation} stableReactions={stableReactions} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({ sprite: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' } });
