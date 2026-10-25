import { useEffect, useReducer, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import type { CompanionAction, CompanionCue } from './behavior';
import { GameBurst, GameComboGlow, GameMomo, GameOverlay } from './CompanionPlayUi';
import { coralGameReducer, createCoralPattern, INITIAL_CORAL_GAME } from './playGames';

// Keep Momo in the open center lane so she reacts without covering a coral cue.
const NAMES = ['coralOne', 'coralTwo', 'coralThree', 'coralFour'] as const;

export function CompanionCoralDuet({ active, cue, stage, best, onReact, onFinish, onBack }: {
  active: boolean; cue: CompanionCue; stage: number; best: number | null;
  onReact: (action: CompanionAction) => void; onFinish: (score: number) => void; onBack: () => void;
}) {
  const { styles } = useStyles();
  const { t } = useTranslation('companionGames');
  const translate = useRef(t);
  translate.current = t;
  const [game, dispatch] = useReducer(coralGameReducer, INITIAL_CORAL_GAME);
  const [lit, setLit] = useState<number | null>(null);
  const [momoSpot, setMomoSpot] = useState<number | null>(null);
  const [burst, setBurst] = useState<{ id: number; x: number; y: number; streak: number } | null>(null);
  const [area, setArea] = useState({ width: 330, height: 360 });
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const finished = useRef(false);
  const burstId = useRef(0);
  const lightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (lightTimer.current) clearTimeout(lightTimer.current);
  }, []);

  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderEnabled);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!active || game.phase !== 'countdown') return;
    const timer = setInterval(() => dispatch({ type: 'countdown', pattern: createCoralPattern(2) }), 1000);
    return () => clearInterval(timer);
  }, [active, game.phase]);
  useEffect(() => {
    if (!active || (game.phase !== 'showing' && game.phase !== 'answering')) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [active, game.phase]);
  useEffect(() => {
    if (!active || game.phase !== 'showing') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stepDuration = screenReaderEnabled ? 1350 : 690;
    game.pattern.forEach((index, step) => {
      timers.push(setTimeout(() => {
        setLit(index); setMomoSpot(index); onReact('chase');
        if (screenReaderEnabled) AccessibilityInfo.announceForAccessibility(
          translate.current('coralLit', { name: translate.current(NAMES[index]) }));
      }, 420 + step * stepDuration));
      // Momo stays by the last coral until the next cue, so the player can
      // see her follow the sequence instead of catching a fleeting movement.
      timers.push(setTimeout(() => setLit(null), 420 + step * stepDuration + 480));
    });
    timers.push(setTimeout(() => { setLit(null); setMomoSpot(null); dispatch({ type: 'shown' }); }, 550 + game.pattern.length * stepDuration));
    return () => timers.forEach(clearTimeout);
  }, [active, area.width, area.height, game.phase, game.pattern, onReact, screenReaderEnabled]);
  useEffect(() => {
    if (!active || game.phase !== 'answering' || game.cursor !== game.pattern.length) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'next', pattern: createCoralPattern(Math.min(5, game.round + 2)) });
      setLit(null); setMomoSpot(null); onReact('celebrate');
    }, 650);
    return () => clearTimeout(timer);
  }, [active, game.phase, game.cursor, game.pattern.length, game.round, onReact]);
  useEffect(() => {
    if (game.phase !== 'done' || finished.current) return;
    finished.current = true; onReact('celebrate'); onFinish(game.score);
  }, [game.phase, game.score, onFinish, onReact]);
  useEffect(() => {
    if (!burst) return;
    const timer = setTimeout(() => setBurst(null), 590);
    return () => clearTimeout(timer);
  }, [burst]);
  const start = () => {
    if (lightTimer.current) clearTimeout(lightTimer.current);
    finished.current = false; setLit(null); setMomoSpot(null);
    dispatch({ type: 'start' }); onReact('hello');
  };
  const pick = (index: number) => {
    if (!active || game.phase !== 'answering' || game.cursor >= game.pattern.length) return;
    const correct = game.pattern[game.cursor] === index;
    dispatch({ type: 'pick', index });
    setLit(index); setMomoSpot(index);
    setBurst({ id: ++burstId.current, streak: correct ? game.streak + 1 : 0,
      x: index % 2 === 0 ? area.width * .24 : area.width * .76,
      y: index < 2 ? area.height * .25 : area.height * .75 });
    void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft);
    onReact(correct ? 'correct' : 'encourage');
    if (lightTimer.current) clearTimeout(lightTimer.current);
    lightTimer.current = setTimeout(() => { setLit(null); setMomoSpot(null); lightTimer.current = null; }, 520);
  };
  return <View style={styles.root}>
    {game.phase === 'showing' || game.phase === 'answering' || game.phase === 'countdown' ? <View style={styles.hud}>
      <Text style={styles.hudValue} accessibilityLabel={t('score', { score: game.score })}
        accessibilityLiveRegion="polite">{t('scoreShort', { score: game.score })}</Text>
      <Text style={styles.hudValue} accessibilityLabel={t('round', { round: game.round })}>
        {t('roundShort', { round: game.round })}</Text>
      <Text style={styles.hudValue}>{t('time', { seconds: game.seconds })}</Text>
    </View> : null}
    <View style={styles.arena} onLayout={event => setArea({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
      <View pointerEvents="none" style={styles.glow} />
      <GameComboGlow active={active && game.streak >= 5} />
      {game.phase === 'showing' || game.phase === 'answering' ? NAMES.map((key, index) => <CoralPad key={key} index={index} lit={lit === index}
        enabled={active && game.phase === 'answering' && game.cursor < game.pattern.length}
        label={t(key)} onPress={() => pick(index)} />) : null}
      <GameMomo stage={stage} cue={cue} active={active} size={Math.min(142, area.width * .38)}
        x={momoSpot === null ? 0 : (momoSpot % 2 === 0 ? -1 : 1) * Math.min(area.width * .2, 78)}
        y={game.phase === 'ready' || game.phase === 'done' ? -135
          : momoSpot === null ? 0 : (momoSpot < 2 ? -1 : 1) * Math.min(area.height * .2, 150)}
        label={t('title')} celebrating={game.phase === 'done'} />
      {burst ? <GameBurst id={burst.id} x={burst.x} y={burst.y} active={active}
        streak={burst.streak} /> : null}
      {(game.phase === 'showing' || game.phase === 'answering') ? <View pointerEvents="none" style={styles.instruction}>
        <Text accessibilityLiveRegion="polite" style={styles.instructionText}>
          {game.streak >= 5 ? t('streak', { count: game.streak })
            : game.phase === 'showing' ? t('watchMomo') : t('yourTurn')}
        </Text>
      </View> : null}
      {game.phase === 'ready' ? <GameOverlay title={t('coral')} detail={t('watchMomo')}
        primary={t('start')} onPrimary={start} /> : null}
      {game.phase === 'countdown' ? <GameOverlay count={game.countdown} /> : null}
      {game.phase === 'done' ? <GameOverlay title={t('done')}
        detail={`${t('resultScore', { score: game.score })}${best !== null ? ` · ${t('best', { score: Math.max(best, game.score) })}` : ''}`}
        primary={t('again')} onPrimary={start} secondary={t('return')} onSecondary={onBack} /> : null}
      {!active && (game.phase === 'countdown' || game.phase === 'showing' || game.phase === 'answering')
        ? <GameOverlay title={t('paused')} /> : null}
    </View>
  </View>;
}

function CoralPad({ index, lit, enabled, label, onPress }: {
  index: number; lit: boolean; enabled: boolean; label: string; onPress: () => void;
}) {
  const { styles, theme } = useStyles();
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(0);
  useEffect(() => { glow.value = withTiming(lit ? 1 : 0, { duration: reduceMotion ? 0 : 180 }); }, [lit, reduceMotion, glow]);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: 1 + glow.value * .15 }],
    opacity: .86 + glow.value * .14 }));
  const colors: [string, string] = [
    [theme.berryTint, theme.berry], [theme.sunTint, theme.sun],
    [theme.mintTint, theme.grass], [theme.violetTint, theme.violet],
  ][index] as [string, string];
  return <Animated.View style={[styles.padShell,
    { backgroundColor: colors[1] },
    index % 2 === 0 ? styles.padLeft : styles.padRight,
    index < 2 ? styles.padTop : styles.padBottom, motion]}>
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled, selected: lit }} disabled={!enabled}
      onPress={onPress} style={({ pressed }) => [styles.pad, pressed && styles.pressed]}>
      <LinearGradient colors={colors} style={styles.padGradient}>
        <Text style={styles.coralSymbol}>🪸</Text>
      </LinearGradient>
    </Pressable>
  </Animated.View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, paddingHorizontal: 4, paddingVertical: 10 },
  hudValue: { flex: 1, minHeight: 44, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden',
    backgroundColor: theme.paper, color: theme.violetDeep, borderRadius: 18, fontFamily: typography.displayExtraBold, fontSize: 17 },
  arena: { flex: 1, minHeight: 300, borderRadius: 30, overflow: 'hidden', borderWidth: 2,
    borderColor: theme.skyLine },
  glow: { ...StyleSheet.absoluteFillObject, borderWidth: 7, borderRadius: 28, borderColor: theme.skyLine, opacity: .4 },
  padShell: { position: 'absolute', zIndex: 2, width: 110, height: 115, alignItems: 'center', justifyContent: 'flex-start', borderRadius: 100 },
  padLeft: { left: '11%' }, padRight: { right: '11%' },
  padTop: { top: '18%' }, padBottom: { bottom: '16%' },
  pad: { width: 110, height: 110, borderRadius: 100, overflow: 'hidden', borderWidth: 3, borderColor: theme.paper },
  padGradient: { width: 104, height: 104, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateY: 4 }, { scale: .96 }] },
  coralSymbol: { fontSize: 49 },
  instruction: { position: 'absolute', top: 14, alignSelf: 'center', backgroundColor: theme.paper,
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18 },
  instructionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 15 },
}));
