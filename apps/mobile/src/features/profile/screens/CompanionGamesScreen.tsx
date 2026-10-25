import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useSoundEffects } from '@/core/audio/useSoundEffects';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { CompanionActor } from '../companion/CompanionActor';
import { CompanionReefBackdrop, CompanionReefBubbles } from '../companion/CompanionReefBackdrop';
import { CompanionBubblePop } from '../companion/CompanionBubblePop';
import { CompanionCoralDuet } from '../companion/CompanionCoralDuet';
import { CompanionPearlQuest } from '../companion/CompanionPearlQuest';
import { readGameBest, saveGameBest, type BestGame } from '../companion/gameBest';
import { useCompanionActive } from '../companion/useCompanionActive';
import type { CompanionAction, CompanionCue } from '../companion/behavior';

type Game = BestGame | 'pearl';

export default function CompanionGamesScreen() {
  const { styles, theme } = useStyles();
  const { height: windowHeight } = useWindowDimensions();
  const { t } = useTranslation('companionGames');
  const router = useRouter();
  const { user } = useCurrentUser();
  const active = useCompanionActive();
  const { playSound } = useSoundEffects();
  const [game, setGame] = useState<Game | null>(null);
  const [cue, setCue] = useState<CompanionCue>({ action: 'hello', sequence: 0 });
  const [best, setBest] = useState<Record<BestGame, number | null>>({ bubbles: null, coral: null });
  const [pearlBest, setPearlBest] = useState<number | null>(null);
  const react = useCallback((action: CompanionAction) => {
    setCue(current => ({ action, sequence: current.sequence + 1 }));
    if (action === 'correct') playSound('correct');
    if (action === 'celebrate') playSound('complete');
  }, [playSound]);
  useEffect(() => {
    let mounted = true;
    void Promise.all([readGameBest('bubbles'), readGameBest('coral')]).then(([bubbles, coral]) => {
      if (mounted) setBest({ bubbles, coral });
    });
    return () => { mounted = false; };
  }, []);
  const finish = useCallback((which: BestGame, score: number) => {
    void saveGameBest(which, score).then(value => {
      setBest(current => ({ ...current, [which]: value }));
    });
  }, []);
  const finishPearl = useCallback((turns: number) => {
    setPearlBest(current => current === null ? turns : Math.min(current, turns));
  }, []);
  const back = () => game ? setGame(null) : router.back();
  const select = (next: Game) => { setGame(next); react('hello'); };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <CompanionReefBackdrop />
    <LinearGradient colors={[theme.skyTint, theme.violetTint]}
      style={[styles.tint, game !== null && styles.playTint]} pointerEvents="none" />
    <CompanionReefBubbles active={active} light maxCount={15} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={back} style={styles.back}>
        <Ionicons name="chevron-back" size={24} color={theme.violetDeep} />
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>{game ? t(game) : t('title')}</Text>
      <View style={styles.headerSpacer} />
    </View>
    {game === 'bubbles' ? <CompanionBubblePop active={active} cue={cue} stage={user?.level ?? 1}
      best={best.bubbles} onReact={react} onFinish={score => finish('bubbles', score)} onBack={() => setGame(null)} />
      : game === 'coral' ? <CompanionCoralDuet active={active} cue={cue} stage={user?.level ?? 1}
        best={best.coral} onReact={react} onFinish={score => finish('coral', score)} onBack={() => setGame(null)} />
        : game === 'pearl' ? <CompanionPearlQuest onReact={react} cue={cue} stage={user?.level ?? 1}
          onSolved={finishPearl} onBack={() => setGame(null)} />
          : <View style={styles.playground}>
            <Text style={styles.funNote}>{t('justForFun')}</Text>
            <View style={styles.momo} pointerEvents="none">
              <CompanionActor size={180} stage={user?.level ?? 1} cue={cue} label={t('title')} stablePresentation />
            </View>
            <View style={styles.bubbleToy}>
              <PlayToy active={active} label={t('bubbles')} accessibilityLabel={t('openBubbles')}
                emoji="🫧" color={theme.skyTint} edge={theme.sky} best={best.bubbles}
                bestLabel={best.bubbles !== null ? t('best', { score: best.bubbles }) : undefined}
                onPress={() => select('bubbles')} />
            </View>
            <View style={[styles.coralToy, windowHeight < 700 && styles.coralToyCompact]}>
              <PlayToy active={active} label={t('coral')} accessibilityLabel={t('openCoral')}
                emoji="🪸" color={theme.berryTint} edge={theme.berry} best={best.coral}
                bestLabel={best.coral !== null ? t('best', { score: best.coral }) : undefined}
                onPress={() => select('coral')} />
            </View>
            <View style={styles.pearlToy}>
              <PlayToy active={active} label={t('pearl')} accessibilityLabel={t('openPearl')}
                emoji="🐚" color={theme.sunTint} edge={theme.sunDeep} best={pearlBest}
                bestLabel={pearlBest !== null ? t('sessionBest', { score: pearlBest }) : undefined}
                onPress={() => select('pearl')} />
            </View>
          </View>}
  </SafeAreaView>;
}

function PlayToy({ active, label, accessibilityLabel, emoji, color, edge, best, bestLabel, onPress }: {
  active: boolean; label: string; accessibilityLabel: string; emoji: string; color: string; edge: string;
  best?: number | null; bestLabel?: string; onPress: () => void;
}) {
  const { styles } = useStyles();
  const reduceMotion = useReducedMotion();
  const drift = useSharedValue(0);
  useEffect(() => {
    if (!active || reduceMotion) { cancelAnimation(drift); drift.value = 0; return; }
    drift.value = withRepeat(withSequence(withTiming(-7, { duration: 1500 }), withTiming(2, { duration: 1700 })), -1, true);
    return () => cancelAnimation(drift);
  }, [active, reduceMotion, drift]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: drift.value }] }));
  return <Animated.View style={[styles.toyWrap, motion]}>
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}
      style={({ pressed }) => [styles.toyButton, { backgroundColor: edge }, pressed && styles.toyPressed]}>
      <LinearGradient colors={[color, edge]} style={styles.toyFace}>
        <Text style={styles.toyEmoji}>{emoji}</Text>
      </LinearGradient>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.toyLabel}>{label}</Text>
      {best !== undefined && best !== null && bestLabel ? <Text style={styles.bestBadge}>{bestLabel}</Text> : null}
    </Pressable>
  </Animated.View>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.skyTint },
  tint: { ...StyleSheet.absoluteFillObject, opacity: .48 },
  playTint: { opacity: .14 },
  header: { height: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.paper,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.violetLine },
  headerSpacer: { width: 48 },
  headerTitle: { flex: 1, textAlign: 'center', color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 25 },
  playground: { flex: 1, minHeight: 420, position: 'relative' },
  funNote: { position: 'absolute', top: 8, alignSelf: 'center', color: theme.violetDeep,
    backgroundColor: theme.paper, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 6,
    fontFamily: typography.bodyExtraBold, fontSize: 13 },
  momo: { position: 'absolute', top: '8%', alignSelf: 'center', width: 180, height: 180 },
  bubbleToy: { position: 'absolute', left: '5%', top: '37%' },
  coralToy: { position: 'absolute', right: '5%', top: '47%' },
  coralToyCompact: { top: '37%' },
  pearlToy: { position: 'absolute', left: 0, right: 0, top: '70%', alignItems: 'center' },
  toyWrap: { width: 132, alignItems: 'center' },
  toyButton: { width: 132, alignItems: 'center', borderRadius: 30, paddingBottom: 6, minHeight: 128 },
  toyPressed: { transform: [{ translateY: 4 }] },
  toyFace: { width: 118, height: 100, borderRadius: 30, borderWidth: 3, borderColor: theme.paper,
    alignItems: 'center', justifyContent: 'center' },
  toyEmoji: { fontSize: 55, lineHeight: 75 },
  toyLabel: { color: theme.ink, backgroundColor: theme.paper, borderRadius: 17, overflow: 'hidden',
    paddingHorizontal: 5, paddingVertical: 3, fontFamily: typography.displayExtraBold, fontSize: 14,
    width: 132, textAlign: 'center', marginTop: -8 },
  bestBadge: { color: theme.violetDeep, backgroundColor: theme.sunTint, borderRadius: 12,
    overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 2,
    fontFamily: typography.bodyExtraBold, fontSize: 11, marginTop: 3 },
}));
