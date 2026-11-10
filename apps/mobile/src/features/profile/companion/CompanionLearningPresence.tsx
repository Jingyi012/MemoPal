import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/core/i18n/useTranslation';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { CompanionActor } from './CompanionActor';
import type { CompanionAction } from './behavior';
import { useCurrentUser } from '../hooks/useCurrentUser';

/** Small, non-blocking reactions shared by the two recall players and home. */
export function CompanionLearningPresence({
  state,
  corner = false,
}: {
  state: 'home' | 'practice' | 'thinking' | 'correct' | 'wrong' | 'complete';
  corner?: boolean;
}) {
  const { styles, theme } = useStyles();
  const { language } = useTranslation('companion');
  const zh = language === 'zh';
  const router = useRouter();
  const { user } = useCurrentUser();
  const reduceMotion = useReducedMotion();
  const [tapSequence, setTapSequence] = useState(0);
  const [petting, setPetting] = useState(false);
  const reactionProgress = useRef(new Animated.Value(0)).current;
  const swimProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => { setPetting(false); }, [state]);
  useEffect(() => {
    if ((!corner && state !== 'practice') || reduceMotion) return;
    const swim = Animated.loop(Animated.sequence([
      Animated.timing(swimProgress, { toValue: 1, duration: 2300, useNativeDriver: true }),
      Animated.timing(swimProgress, { toValue: 0, duration: 2300, useNativeDriver: true }),
    ]));
    swim.start();
    return () => swim.stop();
  }, [corner, reduceMotion, state, swimProgress]);
  useEffect(() => {
    reactionProgress.stopAnimation();
    reactionProgress.setValue(0);
    if (reduceMotion || (state !== 'correct' && state !== 'wrong' && state !== 'complete')) return;
    Animated.timing(reactionProgress, { toValue: 1, duration: state === 'complete' ? 1700 : 1450, useNativeDriver: true }).start();
    return () => reactionProgress.stopAnimation();
  }, [reactionProgress, reduceMotion, state]);
  if (!user) return null;
  const action: CompanionAction =
    state === 'home' || state === 'practice'
      ? 'hello'
      : state === 'correct'
        ? 'correct'
        : state === 'wrong'
          ? 'encourage'
          : state === 'complete'
            ? 'celebrate'
            : 'think';
  const message =
    state === 'home'
      ? zh
        ? '准备好啦，今天也一起进步。'
        : 'Ready when you are. Let’s grow together.'
      : state === 'practice'
        ? zh
          ? '挑一段记忆吧，我陪你一起复习。'
          : 'Pick a memory. I’ll review it with you.'
      : state === 'correct'
        ? zh
          ? '记住啦！我们继续。'
          : 'You remembered! Let’s keep going.'
        : state === 'wrong'
          ? zh
            ? '没关系，一起再想一想。'
            : 'That’s okay. Let’s try it together.'
          : state === 'complete'
            ? zh
              ? '又一起完成一轮，击掌！'
              : 'Another round together. High five!'
            : zh
              ? '慢慢想，我陪着你。'
              : 'Take your time. I’m right here.';
  const isAnswerFeedback = state === 'correct' || state === 'wrong';
  const isCelebration = state === 'complete';
  const cornerMotion = state === 'correct' || isCelebration ? {
    transform: [
      { translateY: reactionProgress.interpolate({ inputRange: [0, .25, .52, .76, 1], outputRange: isCelebration ? [0, -35, 4, -18, -12] : [0, -27, 4, -13, -8] }) },
      { scale: reactionProgress.interpolate({ inputRange: [0, .25, .52, .76, 1], outputRange: isCelebration ? [1, 1.48, .88, 1.18, 1.13] : [1, 1.4, .9, 1.13, 1.1] }) },
    ],
  } : state === 'wrong' ? {
    transform: [
      { translateX: reactionProgress.interpolate({ inputRange: [0, .25, .52, .76, 1], outputRange: [0, -18, 13, -8, -10] }) },
      { rotate: reactionProgress.interpolate({ inputRange: [0, .25, .52, .76, 1], outputRange: ['0deg', '-22deg', '16deg', '-8deg', '-11deg'] }) },
    ],
  } : undefined;
  if (corner && isCelebration) return (
    <Animated.View style={[styles.celebration, cornerMotion]}>
      <View pointerEvents="none" style={styles.celebrationBubble}>
        <Ionicons name="sparkles" size={14} color={theme.sunDeep} />
        <Text style={styles.celebrationBubbleText}>{zh ? '来击掌！' : 'High five!'}</Text>
      </View>
      <Text pointerEvents="none" style={styles.celebrationSparkleTop}>✦</Text>
      <Text pointerEvents="none" style={styles.celebrationSparkleSide}>✧</Text>
      <View pointerEvents="none" style={styles.celebrationShadow} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={zh ? '和沫沫击掌' : 'High five with Momo'}
        accessibilityHint={message}
        onPress={() => {
          setPetting(true);
          setTapSequence((current) => current + 1);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (!reduceMotion) {
            reactionProgress.stopAnimation();
            reactionProgress.setValue(0);
            Animated.timing(reactionProgress, { toValue: 1, duration: 1250, useNativeDriver: true }).start();
          }
        }}
        style={styles.celebrationTouch}>
        <CompanionActor
          stage={user.level ?? 1}
          size={100}
          cue={{ action: petting ? 'highFive' : 'celebrate', sequence: tapSequence }}
        />
      </Pressable>
    </Animated.View>
  );
  if (corner) return (
    <Animated.View style={[styles.corner, cornerMotion]}>
    <Animated.View pointerEvents="none" style={[styles.cornerGlow, state === 'correct' && styles.cornerGlowCorrect, state === 'wrong' && styles.cornerGlowWrong, { transform: [{ scale: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }]} />
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={zh ? '摸摸沫沫' : 'Give Momo a head pat'}
      accessibilityHint={message}
      accessibilityState={{ disabled: isAnswerFeedback }}
      disabled={isAnswerFeedback}
      onPress={() => { setPetting(true); setTapSequence((current) => current + 1); }}
      style={styles.cornerTouch}>
      <CompanionActor
        stage={user.level ?? 1}
        size={94}
        cue={{ action: isAnswerFeedback ? action : petting ? 'pet' : action, sequence: tapSequence }}
      />
    </Pressable>
    <Animated.View pointerEvents="none" style={[styles.cornerBubbleOne, { opacity: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [.24, .7] }), transform: [{ translateY: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [4, -10] }) }] }]} />
    <Animated.View pointerEvents="none" style={[styles.cornerBubbleTwo, { opacity: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [.5, .15] }), transform: [{ translateY: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }] }]} />
    {isAnswerFeedback ? <View pointerEvents="none" style={styles.reactionMark}>
      <Ionicons name={state === 'correct' ? 'sparkles' : 'heart'} size={20} color={state === 'correct' ? theme.sunDeep : theme.berryDeep} />
    </View> : null}
    {isAnswerFeedback ? (
      <View pointerEvents="none" style={[styles.cornerMessage, state === 'correct' ? styles.cornerMessageCorrect : styles.cornerMessageWrong]}>
        <Ionicons name={state === 'correct' ? 'sparkles' : 'heart'} size={12} color={state === 'correct' ? theme.grass : theme.berryDeep} />
        <Text accessibilityLiveRegion="polite" style={[styles.cornerMessageText, { color: state === 'correct' ? theme.grass : theme.berryDeep }]}>
          {state === 'correct' ? (zh ? '好棒！' : 'Great!') : (zh ? '再试试' : 'Try again')}
        </Text>
      </View>
    ) : null}
    </Animated.View>
  );
  const content = (
    <>
      <Animated.View style={state === 'practice' ? { transform: [{ translateY: swimProgress.interpolate({ inputRange: [0, 1], outputRange: [3, -6] }) }] } : undefined}>
        <CompanionActor
          key="memory-momo"
          stage={user?.level ?? 1}
          size={state === 'practice' ? 90 : state === 'complete' ? 100 : 72}
          cue={{ action, sequence: 0 }}
        />
      </Animated.View>
      <View style={styles.words}>
        {state === 'home' || state === 'practice' ? (
          <Text style={styles.name}>{zh ? '沫沫' : 'Momo'}</Text>
        ) : null}
        <Text
          style={styles.message}
          accessibilityLiveRegion={state === 'thinking' || state === 'home' ? 'none' : 'polite'}>
          {message}
        </Text>
        {state === 'home' ? (
          <Text style={styles.link}>{zh ? '去找伙伴玩 →' : 'Visit your companion →'}</Text>
        ) : null}
      </View>
    </>
  );
  return state === 'home' ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={zh ? '进入伙伴空间' : 'Visit your companion'}
      onPress={() => router.push('/companion')}
      style={[styles.row, styles.home]}>
      {content}
    </Pressable>
  ) : (
    <View style={[styles.row, state === 'practice' && styles.home]}>
      {state === 'practice' ? <>
        <LinearGradient pointerEvents="none" colors={[theme.skyTint, theme.violetTint, theme.mintTint]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        <View pointerEvents="none" style={styles.miniGlow} />
        <View pointerEvents="none" style={styles.miniBubbleOne} />
        <View pointerEvents="none" style={styles.miniBubbleTwo} />
      </> : null}
      {content}
    </View>
  );
}

const useStyles = createThemedStyles((t) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
      gap: 8,
      paddingVertical: 4,
    },
    home: {
      overflow: 'hidden',
      backgroundColor: t.violetTint,
      borderColor: t.violetLine,
      borderWidth: 1,
      borderRadius: 22,
      padding: 12,
    },
    miniGlow: { position: 'absolute', left: -18, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: t.paper, opacity: .47 },
    miniBubbleOne: { position: 'absolute', right: 28, top: 14, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: t.skyLine, opacity: .8 },
    miniBubbleTwo: { position: 'absolute', right: 55, bottom: 11, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: t.violetLine, opacity: .75 },
    words: { flex: 1, gap: 4 },
    corner: { position: 'absolute', top: -10, right: 4, width: 116, height: 108, alignItems: 'center', justifyContent: 'center', zIndex: 3, elevation: 3 },
    cornerGlow: { position: 'absolute', top: 25, right: 10, width: 92, height: 65, borderRadius: 45, backgroundColor: t.violetTint, opacity: .82 },
    cornerGlowCorrect: { backgroundColor: t.mintTint },
    cornerGlowWrong: { backgroundColor: t.berryTint },
    celebration: { position: 'absolute', top: 3, right: 1, width: 100, height: 106, zIndex: 3 },
    celebrationTouch: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.sunLine, borderRadius: 28, overflow: 'hidden', transform: [{ rotate: '6deg' }] },
    celebrationBubble: { position: 'absolute', top: 94, right: 5, minWidth: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderColor: t.sunLine, borderRadius: 14, backgroundColor: t.sunTint, zIndex: 2 },
    celebrationBubbleText: { color: t.ink, fontSize: 11, fontWeight: '800' },
    celebrationSparkleTop: { position: 'absolute', top: -3, right: 20, color: t.sunDeep, fontSize: 18, zIndex: 2 },
    celebrationSparkleSide: { position: 'absolute', top: 49, right: 1, color: t.violetDeep, fontSize: 17, zIndex: 2 },
    celebrationShadow: { position: 'absolute', bottom: 9, right: 18, width: 55, height: 5, borderRadius: 20, backgroundColor: t.line },
    cornerTouch: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
    cornerBubbleOne: { position: 'absolute', top: 14, left: 7, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: t.skyLine, backgroundColor: t.skyTint },
    cornerBubbleTwo: { position: 'absolute', top: 34, right: 3, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: t.violetLine, backgroundColor: t.paper },
    reactionMark: { position: 'absolute', top: 7, right: 6, transform: [{ rotate: '15deg' }] },
    cornerMessage: { position: 'absolute', right: 1, bottom: -8, minWidth: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: t.paper },
    cornerMessageCorrect: { borderColor: t.mintLine },
    cornerMessageWrong: { borderColor: t.berryLine },
    cornerMessageText: { fontSize: 10, fontWeight: '800' },
    name: { color: t.ink, fontSize: 14, fontWeight: '700' },
    message: { color: t.inkSoft, fontSize: 13, lineHeight: 20 },
    link: { color: t.violetDeep, fontSize: 12, fontWeight: '700' },
  })
);
