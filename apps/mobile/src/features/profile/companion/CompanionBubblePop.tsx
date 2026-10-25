import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { CompanionAction, CompanionCue } from './behavior';
import { GameBurst, GameComboGlow, GameMomo, GameOverlay } from './CompanionPlayUi';
import { bubbleGameReducer, createBubbleTarget, INITIAL_BUBBLE_GAME, type BubbleTarget } from './playGames';

export function CompanionBubblePop({ active, cue, stage, best, onReact, onFinish, onBack }: {
  active: boolean; cue: CompanionCue; stage: number; best: number | null;
  onReact: (action: CompanionAction) => void; onFinish: (score: number) => void; onBack: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('companionGames');
  const reduceMotion = useReducedMotion();
  const [game, dispatch] = useReducer(bubbleGameReducer, INITIAL_BUBBLE_GAME);
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(360);
  const [momoX, setMomoX] = useState(0);
  const [momoY, setMomoY] = useState(0);
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; streak: number } | null>(null);
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const staticTargets = reduceMotion || screenReaderEnabled;
  const nextId = useRef(1);
  const finished = useRef(false);
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!active || game.phase !== 'countdown') return;
    const timer = setInterval(() => dispatch({ type: 'countdown' }), 1000);
    return () => clearInterval(timer);
  }, [active, game.phase]);
  useEffect(() => {
    if (!active || game.phase !== 'playing') return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    const spawner = setInterval(() => dispatch({ type: 'spawn', target: createBubbleTarget(nextId.current++) }), 620);
    return () => { clearInterval(timer); clearInterval(spawner); };
  }, [active, game.phase]);
  useEffect(() => {
    if (game.phase !== 'done' || finished.current) return;
    finished.current = true;
    onReact('celebrate');
    onFinish(game.score);
  }, [game.phase, game.score, onFinish, onReact]);
  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), 600);
    return () => clearTimeout(timer);
  }, [burst]);
  const expire = useCallback((id: number) => dispatch({ type: 'expire', id }), []);
  const start = () => {
    finished.current = false; nextId.current = 1; setBurst(null); setMomoX(0); setMomoY(0);
    dispatch({ type: 'start', seconds: screenReaderEnabled ? 60 : 45 }); onReact('hello');
  };
  const pop = (target: BubbleTarget, progress: number) => {
    if (!active || game.phase !== 'playing') return;
    dispatch({ type: 'pop', id: target.id });
    const slot = target.slot ?? 0;
    const x = staticTargets
      ? (slot % 4) * (width - target.size) / 3 + target.size / 2
      : target.x * (width - target.size) + target.size / 2;
    const y = staticTargets
      ? height * (slot < 4 ? .4 : .63)
      : height - target.size / 2 - (height + target.size) * progress;
    setMomoX((x - width / 2) * .8);
    setMomoY(Math.max(-height * .32, Math.min(height * .32, (y - height / 2) * .72)));
    setBurst({ id: target.id, x, streak: target.kind === 'bubble' ? game.streak + 1 : 0, y: staticTargets
      ? height * (slot < 4 ? .4 : .63) - target.size / 2
      : height * .48 });
    if (target.kind === 'urchin') {
      void Haptics.selectionAsync(); onReact('encourage');
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReact((game.streak + 1) % 5 === 0 ? 'celebrate' : 'correct');
    }
  };
  return <View style={styles.root}>
    {game.phase === 'playing' || game.phase === 'countdown' ? <View style={styles.hud}>
      <Text style={styles.hudValue} accessibilityLiveRegion="polite">{t('score', { score: game.score })}</Text>
      <Text style={styles.hudValue}>{t('time', { seconds: game.seconds })}</Text>
    </View> : null}
    <View style={styles.arena} onLayout={event => {
      setWidth(event.nativeEvent.layout.width); setHeight(event.nativeEvent.layout.height);
    }}>
      <View pointerEvents="none" style={styles.glow} />
      <GameComboGlow active={active && game.streak >= 5} />
      <GameMomo stage={stage} cue={cue} active={active} x={momoX}
        size={Math.min(164, width * .44)}
        y={game.phase === 'ready' || game.phase === 'done' ? -135 : momoY}
        label={t('title')} celebrating={game.phase === 'done'} />
      {game.targets.map(target => <FloatingTarget key={target.id} target={target} active={active}
        width={width} height={height} screenReaderEnabled={screenReaderEnabled}
        onExpire={expire} onPress={progress => pop(target, progress)}
        label={t(target.kind === 'urchin' ? 'urchinLabel' : 'bubbleLabel')} />)}
      {burst ? <GameBurst id={burst.id} x={burst.x} y={burst.y} active={active}
        streak={burst.streak} /> : null}
      {game.phase === 'playing' ? <View pointerEvents="none" style={styles.hintWrap}>
        <Text style={styles.hint}>{game.streak >= 2 ? t('streak', { count: game.streak }) : t('tapBubbles')}</Text>
      </View> : null}
      {game.phase === 'ready' ? <GameOverlay title={t('bubbles')} detail={t('avoidUrchin')}
        primary={t('start')} onPrimary={start} /> : null}
      {game.phase === 'countdown' ? <GameOverlay count={game.countdown} /> : null}
      {game.phase === 'done' ? <GameOverlay title={t('done')}
        detail={`${t('resultScore', { score: game.score })}${best !== null ? ` · ${t('best', { score: Math.max(best, game.score) })}` : ''}`}
        primary={t('again')} onPrimary={start} secondary={t('return')} onSecondary={onBack} /> : null}
      {!active && (game.phase === 'playing' || game.phase === 'countdown') ? <GameOverlay title={t('paused')} /> : null}
    </View>
  </View>;
}

function FloatingTarget({ target, active, width, height, screenReaderEnabled, onExpire, onPress, label }: {
  target: BubbleTarget; active: boolean; width: number; height: number; screenReaderEnabled: boolean;
  onExpire: (id: number) => void; onPress: (progress: number) => void; label: string;
}) {
  const { styles, theme } = useStyles();
  const reduceMotion = useReducedMotion();
  const staticTarget = reduceMotion || screenReaderEnabled;
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) { cancelAnimation(progress); return; }
    if (staticTarget) { cancelAnimation(progress); return; }
    progress.value = withTiming(1, { duration: 3900 * (1 - progress.value) }, done => {
      if (done) runOnJS(onExpire)(target.id);
    });
    return () => cancelAnimation(progress);
  }, [active, staticTarget, progress, onExpire, target.id]);
  useEffect(() => {
    if (!staticTarget || screenReaderEnabled || !active) return;
    const timer = setTimeout(() => onExpire(target.id), 3900);
    return () => clearTimeout(timer);
  }, [staticTarget, screenReaderEnabled, active, onExpire, target.id]);
  const slot = target.slot ?? 0;
  const left = staticTarget
    ? (slot % 4) * (width - target.size) / 3
    : target.x * (width - target.size);
  const motion = useAnimatedStyle(() => ({
    opacity: staticTarget ? 1 : Math.min(1, (1 - progress.value) * 5),
    transform: [{ translateY: staticTarget
      ? -height * (slot < 4 ? .6 : .37)
      : -(height + target.size) * progress.value }],
  }));
  return <Animated.View style={[styles.targetWrap, { left, width: target.size, height: target.size }, motion]}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => onPress(progress.value)}
      style={({ pressed }) => [styles.target, { width: target.size, height: target.size }, pressed && styles.pressed]}>
      <LinearGradient colors={target.kind === 'urchin'
        ? [theme.violetDeep, theme.night] : [theme.paper, theme.skyTint, theme.sky]}
        style={[styles.targetGradient, { width: target.size - 4, height: target.size - 4 }]}>
        {target.kind === 'urchin' ? <Text style={styles.urchin}>✹</Text>
          : <><View style={styles.glint} /><View style={styles.smallGlint} /></>}
      </LinearGradient>
    </Pressable>
  </Animated.View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10 },
  hudValue: { minWidth: 86, minHeight: 44, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden',
    backgroundColor: theme.paper, color: theme.violetDeep, borderRadius: 18, fontFamily: typography.displayExtraBold, fontSize: 20 },
  arena: { flex: 1, minHeight: 300, borderRadius: 30, overflow: 'hidden', borderWidth: 2, borderColor: theme.skyLine },
  glow: { ...StyleSheet.absoluteFillObject, borderWidth: 7, borderRadius: 28, borderColor: theme.skyLine, opacity: .4 },
  hintWrap: { position: 'absolute', top: 15, alignSelf: 'center', zIndex: 4, backgroundColor: theme.paper,
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
  hint: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 15 },
  targetWrap: { position: 'absolute', bottom: 0, zIndex: 3 },
  target: { borderRadius: 100, borderWidth: 2, borderColor: theme.paper, overflow: 'hidden' },
  targetGradient: { borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: .88 }] },
  glint: { position: 'absolute', left: '18%', top: '17%', width: '30%', height: '20%', borderRadius: 30, backgroundColor: theme.paper, opacity: .9 },
  smallGlint: { position: 'absolute', right: '18%', bottom: '20%', width: 8, height: 8, borderRadius: 5, backgroundColor: theme.paper },
  urchin: { color: theme.paper, fontSize: 39, lineHeight: 49 },
}));
