import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useCompanion, useGreetCompanion } from '@/features/profile/hooks/useCompanion';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { CompanionSwimmer } from '../companion/CompanionSwimmer';
import { CompanionReefBackdrop, CompanionReefBubbles } from '../companion/CompanionReefBackdrop';
import { useCompanionActive } from '../companion/useCompanionActive';
import { ACTION_DURATION, type CompanionAction, type CompanionCue } from '../companion/behavior';
import { chooseIdleBehavior, choosePetReaction, isTapEasterEgg, nextIdleDelay, timeOfDay, type IdleBehavior, type PetReaction } from '../companion/playBehavior';
import { CompanionProgressRing } from '../components/CompanionProgressRing';
import { GameButton } from '../components/GameButton';
import CompanionHelpSheet from '../components/CompanionHelpSheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

type DockPanel = 'play' | 'growth' | null;
const reactionActions: Record<PetReaction, CompanionAction> = {
  smile: 'hello', hop: 'highFive', twirl: 'spin', bubbles: 'pet', close: 'peek', rare: 'rare',
};
const idleActions: Record<IdleBehavior, CompanionAction> = {
  chase: 'chase', yawn: 'yawn', peek: 'peek', twirl: 'spin', blink: 'idle',
};

export default function CompanionHubScreen() {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('companion');
  const router = useRouter();
  const { user } = useCurrentUser();
  const companion = useCompanion();
  const refetchCompanion = companion.refetch;
  const greet = useGreetCompanion();
  const active = useCompanionActive();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const helpSheetRef = useRef<BottomSheetModal>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const idlePlaying = useRef(false);
  const held = useRef(false);
  const pending = useRef<PetReaction | 'easter' | null>(null);
  const recentTaps = useRef<number[]>([]);
  const lastPet = useRef<PetReaction | null>(null);
  const lastIdle = useRef<IdleBehavior | null>(null);
  const lastPracticeId = useRef<string | null | undefined>(undefined);
  const previousBond = useRef<number | null>(null);
  const lastBlur = useRef<number | null>(null);
  const firstReturnChecked = useRef(false);
  const [cue, setCue] = useState<CompanionCue>({ action: 'idle', sequence: 0 });
  const [panel, setPanel] = useState<DockPanel>(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [period, setPeriod] = useState(() => timeOfDay(new Date().getHours()));
  const [basePeriod, setBasePeriod] = useState(() => timeOfDay(new Date().getHours()));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [burst, setBurst] = useState<'heart' | 'star' | 'bubble' | null>(null);
  const [popped, setPopped] = useState<number[]>([]);
  const panelOpen = useSharedValue(0);
  const atmosphere = useSharedValue(1);
  const burstMotion = useSharedValue(0);
  const numberMotion = useSharedValue(0);
  const [bondChange, setBondChange] = useState<number | null>(null);
  const stageHeight = Math.max(220, height - insets.bottom - 205);
  const actorSize = Math.min(width * .62, stageHeight * .58, 300);
  const isNight = period === 'night';
  const rareMessage = t('habitatRare');
  const easterMessage = t('habitatEasterEgg');
  const welcomeMessage = t('habitatWelcome');
  const longReturnMessage = t('habitatLongReturn');
  const latestPractice = useMemo(() => companion.data?.memories
    .filter((memory) => /practice|review/i.test(memory.type))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0], [companion.data?.memories]);
  useEffect(() => {
    firstReturnChecked.current = false;
    lastPracticeId.current = undefined;
    previousBond.current = null;
    lastPet.current = null;
    lastIdle.current = null;
  }, [user?.id]);

  const say = useCallback((message: string | null, effect: typeof burst = null) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    setBurst(effect);
    if (effect && active && !reduceMotion) {
      burstMotion.value = 0;
      burstMotion.value = withTiming(1, { duration: 900 });
    }
    feedbackTimer.current = setTimeout(() => { setFeedback(null); setBurst(null); }, 1900);
  }, [active, reduceMotion, burstMotion]);

  const interruptIdle = useCallback(() => {
    if (!idlePlaying.current) return;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    idlePlaying.current = false;
    busy.current = false;
    setCue((current) => ({ action: 'idle', sequence: current.sequence + 1 }));
  }, []);

  const playAction = useCallback((action: CompanionAction, message: string | null = null,
    effect: typeof burst = null, stronger = false, fromIdle = false) => {
    if (!active) return;
    busy.current = true;
    idlePlaying.current = fromIdle;
    setCue((current) => ({ action, sequence: current.sequence + 1 }));
    say(message, effect);
    if (!fromIdle) void Haptics.impactAsync(stronger ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => {
      busy.current = false;
      idlePlaying.current = false;
      setCue((current) => ({ action: 'idle', sequence: current.sequence + 1 }));
      const queued = pending.current;
      pending.current = null;
      if (queued === 'easter') playAction('spin', easterMessage, 'heart', true);
      else if (queued) playAction(reactionActions[queued], queued === 'rare' ? rareMessage : null,
        queued === 'rare' ? 'star' : queued === 'bubbles' ? 'bubble' : null, queued === 'rare');
    }, ACTION_DURATION[action]);
  }, [active, say, rareMessage, easterMessage]);

  const pet = useCallback(() => {
    if (!active) return;
    interruptIdle();
    const now = Date.now();
    recentTaps.current = [...recentTaps.current.filter((tap) => now - tap <= 2200), now].slice(-5);
    if (isTapEasterEgg(recentTaps.current, now)) {
      recentTaps.current = [];
      if (busy.current) pending.current = 'easter';
      else playAction('spin', easterMessage, 'heart', true);
      return;
    }
    const reaction = choosePetReaction(lastPet.current);
    lastPet.current = reaction;
    if (busy.current) { pending.current = reaction; return; }
    playAction(reactionActions[reaction], reaction === 'rare' ? rareMessage : null,
      reaction === 'rare' ? 'star' : reaction === 'bubbles' ? 'bubble' : null, reaction === 'rare');
  }, [active, playAction, rareMessage, easterMessage, interruptIdle]);

  const hug = useCallback(() => {
    held.current = true;
    interruptIdle();
    if (busy.current) { pending.current = 'close'; return; }
    playAction('hug', null, 'heart');
  }, [playAction, interruptIdle]);

  const releaseHug = useCallback(() => {
    if (!held.current) return;
    held.current = false;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    busy.current = false;
    setCue((current) => ({ action: 'idle', sequence: current.sequence + 1 }));
  }, []);

  useEffect(() => {
    panelOpen.value = withTiming(panel ? 1 : 0, { duration: reduceMotion ? 0 : 260 });
  }, [panel, panelOpen, reduceMotion]);
  const drawerStyle = useAnimatedStyle(() => ({ opacity: panelOpen.value,
    transform: [{ translateY: 150 * (1 - panelOpen.value) }] }));
  const burstStyle = useAnimatedStyle(() => ({ opacity: 1 - burstMotion.value,
    transform: [{ translateY: -65 * burstMotion.value }, { scale: .7 + burstMotion.value * .8 }] }));
  const numberStyle = useAnimatedStyle(() => ({ opacity: 1 - numberMotion.value,
    transform: [{ translateY: -55 * numberMotion.value }] }));
  const atmosphereStyle = useAnimatedStyle(() => ({ opacity: atmosphere.value }));

  useEffect(() => {
    if (!active) return;
    const refresh = () => setPeriod(timeOfDay(new Date().getHours()));
    refresh();
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, [active]);
  useEffect(() => {
    if (period === basePeriod) return;
    atmosphere.value = 0;
    atmosphere.value = withTiming(1, { duration: reduceMotion ? 0 : 2500 });
    const timer = setTimeout(() => setBasePeriod(period), reduceMotion ? 0 : 2500);
    return () => clearTimeout(timer);
  }, [period, basePeriod, atmosphere, reduceMotion]);

  useEffect(() => {
    if (!active || reduceMotion || photoMode || panel || !companion.data) return;
    let cancelled = false;
    const schedule = () => {
      idleTimer.current = setTimeout(() => {
        if (cancelled) return;
        if (!busy.current) {
          const next = chooseIdleBehavior(lastIdle.current, Math.random, isNight);
          lastIdle.current = next;
          if (next !== 'blink') playAction(idleActions[next], null, null, false, true);
        }
        schedule();
      }, nextIdleDelay(Math.random, isNight));
    };
    schedule();
    return () => { cancelled = true; if (idleTimer.current) clearTimeout(idleTimer.current); };
  }, [active, reduceMotion, photoMode, panel, companion.data, isNight, playAction]);

  useEffect(() => {
    if (!active || !companion.data) return;
    if (!firstReturnChecked.current) {
      firstReturnChecked.current = true;
      const lastVisit = Math.max(...companion.data.memories.map((memory) => Date.parse(memory.occurredAt)).filter(Number.isFinite));
      if (Number.isFinite(lastVisit) && Date.now() - lastVisit >= 3 * 24 * 60 * 60 * 1000 && !busy.current) {
        playAction('hello', longReturnMessage);
      }
    }
    if (lastPracticeId.current === undefined) lastPracticeId.current = latestPractice?.id ?? null;
    else if (latestPractice && latestPractice.id !== lastPracticeId.current) {
      lastPracticeId.current = latestPractice.id;
      if (!busy.current) playAction('celebrate', welcomeMessage, 'heart');
    }
    if (previousBond.current !== null && companion.data.bondPoints > previousBond.current) {
      setBondChange(companion.data.bondPoints - previousBond.current);
      numberMotion.value = 0;
      numberMotion.value = withDelay(250, withTiming(1, { duration: reduceMotion ? 250 : 950 }));
      const timer = setTimeout(() => setBondChange(null), 1300);
      previousBond.current = companion.data.bondPoints;
      return () => clearTimeout(timer);
    }
    previousBond.current = companion.data.bondPoints;
  }, [active, companion.data, latestPractice, playAction, welcomeMessage, longReturnMessage, numberMotion, reduceMotion]);
  useEffect(() => {
    if (!active) { lastBlur.current = Date.now(); return; }
    if (lastBlur.current && Date.now() - lastBlur.current >= 3 * 24 * 60 * 60 * 1000 && !busy.current) {
      playAction('hello', longReturnMessage);
    }
    lastBlur.current = null;
    void refetchCompanion();
  }, [active, refetchCompanion, longReturnMessage, playAction]);
  useEffect(() => () => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    cancelAnimation(atmosphere); cancelAnimation(burstMotion); cancelAnimation(numberMotion);
  }, [atmosphere, burstMotion, numberMotion]);
  useEffect(() => {
    if (active) return;
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    cancelAnimation(atmosphere);
    cancelAnimation(burstMotion);
    cancelAnimation(numberMotion);
    busy.current = false; idlePlaying.current = false; pending.current = null;
    setFeedback(null); setBurst(null);
  }, [active, atmosphere, burstMotion, numberMotion]);

  const greetToday = Boolean(companion.data?.memories.some((memory) =>
    memory.type.toLowerCase() === 'greeting' && memory.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)));
  const greetMomo = () => {
    playAction('hello');
    if (!greetToday && !greet.isPending) greet.mutate();
  };
  const palette = (value: typeof period) => value === 'day'
    ? [theme.skyTint, theme.mintTint, theme.violetTint] as const
    : value === 'dusk'
      ? [theme.peachTint, theme.violetTint, theme.violet] as const
      : [theme.nightDeep, theme.night, theme.violetDeep] as const;
  const progress = companion.data?.bondProgress ?? 0;
  const bondPoints = companion.data?.bondPoints ?? 0;
  const level = Math.max(1, user?.level ?? 1);

  return <SafeAreaView style={[styles.safe, { backgroundColor: palette(period)[2] }]} edges={['bottom']}>
    <StatusBar style={companion.data ? 'light' : 'dark'} translucent backgroundColor="transparent" />
    <LinearGradient colors={palette(basePeriod)} style={styles.background}>
      {!companion.data && companion.isLoading ? <View style={styles.state}><ActivityIndicator color={theme.violetDeep} /><Text style={styles.stateText}>{t('habitatLoading')}</Text></View>
        : !companion.data ? <View style={styles.state}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.violetDeep} />
          <Text style={styles.stateText}>{t('habitatError')}</Text>
          <GameButton label={t('habitatRetry')} onPress={() => { void companion.refetch(); }} />
        </View> : <>
          <View style={[styles.stage, { height: photoMode ? height - insets.bottom : stageHeight }]}>
            <CompanionReefBackdrop />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, atmosphereStyle]}>
              <LinearGradient colors={palette(period)} style={[StyleSheet.absoluteFill, styles.atmosphereOverlay]} />
            </Animated.View>
            <LinearGradient pointerEvents="none" colors={[theme.nightDeep, 'transparent']}
              style={[styles.headerShade, { height: insets.top + 105 }]} />
            {!photoMode && <View style={[styles.topBar, { top: insets.top }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatBack')} onPress={() => router.back()} style={styles.roundButton}>
                <Ionicons name="chevron-back" size={23} color={theme.violetDeep} />
              </Pressable>
              <View pointerEvents="none" style={styles.titleSlot}>
                <Text style={styles.title} numberOfLines={1}>{t('habitatTitle')}</Text>
              </View>
              <CompanionProgressRing progress={progress} level={level} label={t('habitatBond')} />
            </View>}
            <LinearGradient pointerEvents="none" colors={['transparent', palette(period)[2]]} style={styles.stageFade} />
              <CompanionReefBubbles active={active && !panel && !reduceMotion} />
            <EnvironmentObject active={active && !panel} kind="bubble" index={0} popped={popped.includes(0)} onPress={() => { interruptIdle(); setPopped([0]); void Haptics.selectionAsync(); setTimeout(() => setPopped([]), 1100); }} />
            <EnvironmentObject active={active && !panel} kind="shell" index={1} popped={popped.includes(1)} onPress={() => { interruptIdle(); setPopped([1]); void Haptics.selectionAsync(); setTimeout(() => setPopped([]), 1100); }} />
            <EnvironmentObject active={active && !panel} kind="starfish" index={2} popped={popped.includes(2)} onPress={() => { interruptIdle(); setPopped([2]); void Haptics.selectionAsync(); setTimeout(() => setPopped([]), 1100); }} />
            {isNight && <View pointerEvents="none" style={styles.nightGlow}><Ionicons name="sparkles" size={28} color={theme.sky} /></View>}
            <CompanionSwimmer active={active && !panel} reduceMotion={reduceMotion} slow={isNight} cue={cue} stage={level} size={actorSize}
              stablePresentation
              tankWidth={width} tankHeight={photoMode ? height - insets.bottom : stageHeight}
              label={t('habitatPet')} hint={t('habitatHugHint')} onPress={pet} onLongPress={hug} onPressOut={releaseHug} />
            {burst && !reduceMotion && <Animated.View pointerEvents="none" style={[styles.burst, burstStyle]}>
              <Ionicons name={burst === 'heart' ? 'heart' : burst === 'star' ? 'star' : 'ellipse-outline'} size={33}
                color={burst === 'heart' ? theme.berry : burst === 'star' ? theme.sun : theme.sky} />
              <Ionicons name={burst === 'heart' ? 'heart' : 'sparkles'} size={21} color={theme.paper} />
              <Ionicons name={burst === 'heart' ? 'heart' : 'sparkles'} size={16} color={theme.sun} />
            </Animated.View>}
            {feedback && !photoMode && <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.feedbackBubble}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>}
            {!photoMode && <View style={[styles.stageCorner, { top: insets.top + 78 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatPhoto')} onPress={() => setPhotoMode(true)} style={styles.roundButton}>
                <Ionicons name="camera-outline" size={22} color={theme.violetDeep} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatGames')} onPress={() => router.push('/companion-games')} style={styles.roundButton}>
                <Ionicons name="game-controller-outline" size={22} color={theme.violetDeep} />
                <View style={styles.gameBadge} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatHelp')} onPress={() => helpSheetRef.current?.present()} style={styles.roundButton}>
                <Ionicons name="help" size={20} color={theme.violetDeep} />
              </Pressable>
            </View>}
            {photoMode && <Pressable accessibilityRole="button" accessibilityLabel={t('habitatExitPhoto')}
              onPress={() => setPhotoMode(false)} style={[styles.exitPhoto, { top: insets.top + 18 }]}>
              <Ionicons name="close" size={25} color={theme.violetDeep} />
            </Pressable>}
            {photoMode && <>
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatExitPhoto')}
                onPress={() => setPhotoMode(false)} style={[styles.photoEdge, styles.photoEdgeLeft]} />
              <Pressable accessibilityRole="button" accessibilityLabel={t('habitatExitPhoto')}
                onPress={() => setPhotoMode(false)} style={[styles.photoEdge, styles.photoEdgeRight]} />
            </>}
          </View>
          {!photoMode && <View style={[styles.controls, { backgroundColor: palette(period)[2] }]}>
            <GameButton label={t('habitatReview')} onPress={() => router.push('/practice')}
              icon={<Ionicons name="book-outline" size={22} color={theme.onAccent} />} />
            <DrawerHandle label={t('habitatGrowth')} open={panel !== null} onDark
              onChange={(opened) => setPanel(opened ? 'growth' : null)} />
          </View>}
          {!photoMode && panel && <Pressable accessibilityRole="button" accessibilityLabel={t('habitatClosePanel')}
            onPress={() => setPanel(null)} style={styles.drawerScrim} />}
          {!photoMode && <Animated.View pointerEvents={panel ? 'auto' : 'none'} style={[styles.drawer, drawerStyle]}>
              <DrawerHandle label={panel ? t('habitatClosePanel') : t('habitatGrowth')} open={panel !== null}
                onChange={(opened) => setPanel(opened ? 'growth' : null)} />
              {panel === 'play' ? <View style={styles.drawerRow}>
                <RoundAction icon="heart-outline" label={t('habitatHug')} onPress={() => playAction('hug', null, 'heart')} />
                <RoundAction icon="hand-left-outline" label={t('habitatPet')} onPress={pet} />
                <RoundAction icon="chatbubble-ellipses-outline" label={t('habitatHello')} onPress={greetMomo} />
              </View> : panel === 'growth' ? <View style={styles.drawerRow}>
                <Stat icon="heart" value={bondPoints} label={t('habitatBondPoints')} />
                <Stat icon="sparkles" value={companion.data.bondToNextStage} label={t('habitatToNext')} />
                <Stat icon="book" value={companion.data.todayPracticeCount} label={t('habitatToday')} />
              </View> : null}
              {greet.isError && panel === 'play' && <Text accessibilityRole="alert" style={styles.errorText}>{t('habitatGreetingError')}</Text>}
          </Animated.View>}
          {!photoMode && <View style={styles.dock}>
              <DockButton icon="happy-outline" label={t('habitatPlay')} selected={panel === null || panel === 'play'} onPress={() => setPanel(panel === 'play' ? null : 'play')} />
              <DockButton icon="shirt-outline" label={t('habitatCloset')} selected={false} onPress={() => router.push('/companion-studio')} />
              <DockButton icon="game-controller-outline" label={t('habitatGames')} selected={false} onPress={() => router.push('/companion-games')} />
              <DockButton icon="ribbon-outline" label={t('habitatGrowth')} selected={panel === 'growth'} onPress={() => setPanel(panel === 'growth' ? null : 'growth')} />
          </View>}
          {bondChange !== null && !photoMode && <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.flyingNumber, numberStyle]}>
            <Text style={styles.flyingText}>+{bondChange}</Text>
          </Animated.View>}
        </>}
      <CompanionHelpSheet ref={helpSheetRef} />
    </LinearGradient>
  </SafeAreaView>;

  function RoundAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.roundAction}>
      <Ionicons name={icon} size={26} color={theme.violetDeep} /><Text style={styles.actionLabel}>{label}</Text>
    </Pressable>;
  }
  function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string }) {
    return <View accessible accessibilityLabel={`${label} ${value}`} style={styles.stat}>
      <Ionicons name={icon} size={19} color={theme.violetDeep} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>
    </View>;
  }
}

function DockButton({ icon, label, selected, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; selected: boolean; onPress: () => void }) {
  const { styles, theme } = useStyles();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = reduceMotion ? 1 : selected
      ? withSequence(withTiming(1.22, { duration: 120 }), withSpring(1.08, { damping: 10 }))
      : withTiming(1, { duration: 160 });
  }, [scale, reduceMotion, selected]);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={motion}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => {
      void Haptics.selectionAsync(); onPress();
    }} style={[styles.dockButton, selected && styles.dockSelected]}>
      <Ionicons name={icon} size={25} color={selected ? theme.violetDeep : theme.inkSoft} />
    </Pressable>
  </Animated.View>;
}

function DrawerHandle({ label, open, onChange, onDark = false }: { label: string; open: boolean; onChange: (open: boolean) => void; onDark?: boolean }) {
  const { styles, theme } = useStyles();
  const drag = Gesture.Pan().activeOffsetY([-10, 10]).onEnd((event) => {
    if (event.translationY < -25) runOnJS(onChange)(true);
    else if (event.translationY > 25) runOnJS(onChange)(false);
  });
  return <GestureDetector gesture={drag}><View style={styles.handleArea}>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }}
      onPress={() => onChange(!open)} style={styles.handleTouch}>
      <View style={[styles.handle, { backgroundColor: onDark ? theme.paper : theme.violetDeep }]} />
    </Pressable>
  </View></GestureDetector>;
}

function EnvironmentObject({ kind, index, popped, onPress, active }: { kind: 'bubble' | 'shell' | 'starfish'; index: number; popped: boolean; onPress: () => void; active: boolean }) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('companion');
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => {
    if (!active || reduceMotion) { lift.value = 0; return; }
    lift.value = withRepeat(withSequence(withTiming(1, { duration: 1400 + index * 220 }),
      withTiming(0, { duration: 1700 + index * 180 })), -1, false);
    return () => cancelAnimation(lift);
  }, [active, reduceMotion, index, lift]);
  const motion = useAnimatedStyle(() => ({ opacity: popped ? 0 : .82 + lift.value * .18,
    transform: [{ translateY: -8 * lift.value }, { scale: popped ? .4 : 1 }] }));
  const label = t(kind === 'bubble' ? 'habitatBubble' : kind === 'shell' ? 'habitatShell' : 'habitatStarfish');
  return <View style={[styles.environmentObject, index === 0 ? styles.objectOne : index === 1 ? styles.objectTwo : styles.objectThree]}>
    <Animated.View style={motion}>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: popped }}
        disabled={popped} onPress={onPress} style={styles.objectPress}>
        <Svg width={46} height={46} viewBox="0 0 48 48" accessible={false}>
          <Defs><RadialGradient id="objectFill" cx="28%" cy="22%" rx="70%" ry="75%">
            <Stop offset="0%" stopColor={theme.paper} />
            <Stop offset="52%" stopColor={kind === 'bubble' ? theme.skyTint : kind === 'shell' ? theme.peachTint : theme.sunTint} />
            <Stop offset="100%" stopColor={kind === 'bubble' ? theme.sky : kind === 'shell' ? theme.berry : theme.sunDeep} />
          </RadialGradient></Defs>
          {kind === 'bubble' ? <>
            <Circle cx="24" cy="24" r="17" fill="url(#objectFill)" fillOpacity={.7} stroke={theme.paper} strokeWidth="2" />
            <Ellipse cx="17" cy="15" rx="5" ry="3" fill={theme.paper} fillOpacity={.9} transform="rotate(-32 17 15)" />
            <Circle cx="32" cy="31" r="2" fill={theme.paper} fillOpacity={.8} />
          </> : kind === 'shell' ? <>
            <Path d="M24 9 C35 10 41 22 39 32 Q24 43 9 32 C7 22 13 10 24 9 Z" fill="url(#objectFill)" stroke={theme.paper} strokeWidth="2" />
            <Path d="M24 11 L24 37 M24 12 Q16 23 17 36 M24 12 Q32 23 31 36 M13 18 Q18 26 20 38 M35 18 Q30 26 28 38" stroke={theme.paper} strokeOpacity={.8} strokeWidth="1.5" fill="none" />
          </> : <>
            <Path d="M24 5 Q27 5 28 18 Q40 12 42 16 Q44 20 32 25 Q41 33 38 37 Q35 41 25 31 Q15 41 11 37 Q8 33 17 25 Q4 20 7 16 Q10 12 21 18 Q21 5 24 5 Z" fill="url(#objectFill)" stroke={theme.paper} strokeWidth="2" strokeLinejoin="round" />
            <Circle cx="23" cy="21" r="2" fill={theme.paper} fillOpacity={.85} />
            <Circle cx="30" cy="27" r="1.5" fill={theme.paper} fillOpacity={.7} />
          </>}
        </Svg>
      </Pressable>
    </Animated.View>
    {popped && <View pointerEvents="none" style={styles.splash}>
      <View style={[styles.splashDot, { top: 1, left: 6 }]} /><View style={[styles.splashDot, { top: 14, right: 1 }]} />
      <View style={[styles.splashDot, { bottom: 2, left: 13 }]} />
    </View>}
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  safe: { flex: 1 }, background: { flex: 1 },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 35 },
  stateText: { color: theme.ink, fontFamily: typography.display, fontSize: 19, textAlign: 'center' },
  topBar: { position: 'absolute', left: 0, right: 0, height: 66, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 6 },
  titleSlot: { position: 'absolute', left: 72, right: 72, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.paper, fontFamily: typography.displayExtraBold, fontSize: 22, textAlign: 'center' },
  roundButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.violetLine, alignItems: 'center', justifyContent: 'center' },
  stage: { width: '100%', position: 'relative', overflow: 'hidden' }, atmosphereOverlay: { opacity: .42 },
  headerShade: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 },
  stageFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, zIndex: 2 },
  nightGlow: { position: 'absolute', right: '18%', top: '21%', opacity: .8 },
  stageCorner: { position: 'absolute', right: 16, top: 18, gap: 10, zIndex: 5 }, gameBadge: { position: 'absolute', right: 2, top: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.berry, borderWidth: 1, borderColor: theme.paper },
  exitPhoto: { position: 'absolute', top: 18, right: 18, width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: theme.paper, zIndex: 9 },
  photoEdge: { position: 'absolute', top: '30%', bottom: '30%', width: 44, zIndex: 8 },
  photoEdgeLeft: { left: 0 }, photoEdgeRight: { right: 0 },
  feedbackBubble: { position: 'absolute', top: '10%', alignSelf: 'center', maxWidth: '70%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 17, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.violetLine, zIndex: 7 },
  feedbackText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  burst: { position: 'absolute', left: '49%', top: '37%', flexDirection: 'row', gap: 4, zIndex: 8 },
  environmentObject: { position: 'absolute', zIndex: 4 }, objectOne: { left: '13%', top: '33%' }, objectTwo: { right: '19%', bottom: '16%' }, objectThree: { left: '14%', bottom: '15%' },
  objectPress: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  splash: { ...StyleSheet.absoluteFillObject }, splashDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, backgroundColor: theme.sky },
  controls: { flex: 1, minHeight: 180, justifyContent: 'flex-end', paddingTop: 8, paddingHorizontal: 17, paddingBottom: 80 },
  drawerScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.nightDeep, opacity: .54, zIndex: 8 },
  drawer: { position: 'absolute', left: 17, right: 17, bottom: 80, height: 138, overflow: 'hidden', justifyContent: 'flex-start', borderRadius: 22, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.violetLine, zIndex: 9 },
  drawerRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  handleArea: { height: 44, alignItems: 'center', justifyContent: 'center' }, handleTouch: { width: 64, height: 44, alignItems: 'center', justifyContent: 'center' }, handle: { width: 46, height: 6, borderRadius: 3 },
  roundAction: { minWidth: 70, minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 4 }, actionLabel: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 11 },
  stat: { minWidth: 76, alignItems: 'center', gap: 3 }, statValue: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 }, statLabel: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 },
  errorText: { color: theme.berryDeep, textAlign: 'center', fontFamily: typography.bodyBold, fontSize: 11 },
  dock: { position: 'absolute', bottom: 8, left: 17, right: 17, height: 65, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderRadius: 24, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.violetLine, zIndex: 10 },
  dockButton: { minWidth: 56, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }, dockSelected: { backgroundColor: theme.violetTint },
  flyingNumber: { position: 'absolute', top: 90, right: 25, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.paper },
  flyingText: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 18 },
}));
