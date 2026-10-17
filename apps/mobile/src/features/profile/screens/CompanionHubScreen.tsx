import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { CompanionCharacterArtwork } from '../components/CompanionCharacterArtwork';
import { CompanionPortraitArtwork } from '../components/CompanionPortraitArtwork';
import { CompanionSwitcher } from '../components/CompanionSwitcher';
import CompanionHelpSheet from '../components/CompanionHelpSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useCompanion, useGreetCompanion, useSelectCompanion } from '@/features/profile/hooks/useCompanion';
import type { CompanionDialogueLine, CompanionDialogueTrigger } from '@/features/profile/api/companion.api';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { useAppearance } from '@/features/appearance/hooks/useAppearance';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleHelp, Sparkles } from '@/core/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

export default function CompanionHubScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { language } = useTranslation('profile');
  const { t: companionT } = useTranslation('companion');
  const chinese = language === 'zh';
  const { user } = useCurrentUser();
  const { avatars, isLoading: avatarsLoading } = useAvatars();
  const { items: appearanceItems } = useAppearance();
  const companion = useCompanion();
  const greet = useGreetCompanion();
  const selectCompanion = useSelectCompanion();
  const isFocused = useIsFocused();
  const scrollRef = useRef<ScrollView>(null);
  const helpSheetRef = useRef<BottomSheetModal>(null);
  const { width, height } = useWindowDimensions();
  const artworkSize = Math.min(340, Math.max(230, width - 76));
  const stageHeight = Math.max(330, Math.min(400, height * 0.4));
  const lastTapAt = useRef(0);
  const lastPracticeMemoryId = useRef<string | null | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const reactionMotion = useSharedValue(0);
  const idleMotion = useSharedValue(0);
  const starMotion = useSharedValue(0);
  const [dialogueLine, setDialogueLine] = useState<CompanionDialogueLine | null>(null);
  const [memoryStarVisible, setMemoryStarVisible] = useState(false);
  const [memoryStarCaught, setMemoryStarCaught] = useState(false);
  const [memoryStarOnLeft, setMemoryStarOnLeft] = useState(true);
  const dialogueTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const caughtStarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStarAt = useRef(0);
  const lastLineByTrigger = useRef<Partial<Record<CompanionDialogueTrigger, string>>>({});
  const activeDialogue = useRef<{ priority: number; expiresAt: number; lineId: string } | null>(null);
  const companionSnapshot = useRef<{ avatarId: string | null; bondStage: string; look: string } | null>(null);
  const lastBlurAt = useRef<number | null>(null);
  const [reactionKind, setReactionKind] = useState<CompanionDialogueLine['reaction']>('bounce');
  const idleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * idleMotion.value }, { rotate: `${idleMotion.value}deg` }],
  }));
  const memoryStarMotionStyle = useAnimatedStyle(() => ({
    opacity: 0.94 + Math.sin(starMotion.value * Math.PI * 2) * 0.06,
    transform: [
      { translateY: Math.sin(starMotion.value * Math.PI * 2) * 9 },
      { translateX: Math.sin(starMotion.value * Math.PI) * 7 },
      { rotate: `${Math.sin(starMotion.value * Math.PI * 2) * 12}deg` },
      { scale: 0.92 + (Math.sin(starMotion.value * Math.PI * 2) + 1) * 0.08 },
    ],
  }));
  const characterStyle = useAnimatedStyle(() => {
    const tilt = reactionKind === 'tilt';
    const catchStar = reactionKind === 'catch_star';
    return { transform: [
      { translateY: -(catchStar ? 13 : 8) * reactionMotion.value },
      { rotate: `${(tilt ? 8 : -3) * reactionMotion.value}deg` },
      { scale: 1 + (catchStar ? 0.06 : 0.035) * reactionMotion.value },
    ] };
  });
  const level = useLevelByXp(Math.max(0, user?.totalXp ?? 0), user?.level).levelInfo?.currentLevel ?? user?.level ?? 1;
  const avatar = getEquippedAvatar(avatars, companion.data?.avatarId, level);
  const bondStages = companion.data?.bondStages ?? [];
  const bondStageIndex = Math.max(0, bondStages.findIndex((stage) => stage.key === companion.data?.bondStage));
  const currentBondStage = bondStages[bondStageIndex];
  const nextBondStage = bondStages[Math.min(bondStages.length - 1, bondStageIndex + 1)];

  const retry = () => { void companion.refetch(); };
  const openPractice = () => router.push('/practice');
  const latestPractice = useMemo(() => companion.data?.memories
    .filter((memory) => /practice|review/i.test(memory.type) && (chinese ? memory.summaryZh : memory.summaryEn).trim())
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))[0], [companion.data?.memories, chinese]);
  const showDialogue = useCallback((trigger: CompanionDialogueTrigger) => {
    const priority: Record<CompanionDialogueTrigger, number> = { tap: 1, star: 3, return: 4, greeting: 5, outfit: 6, practice: 7, bond: 8 };
    if (activeDialogue.current && activeDialogue.current.expiresAt > Date.now() && priority[trigger] < activeDialogue.current.priority) return null;
    const all = companion.data?.dialogueLines ?? [];
    const eligible = all.filter((line) => line.trigger === trigger && (!line.stageKey || line.stageKey === companion.data?.bondStage));
    const companionLines = eligible.filter((line) => line.companionKey === avatar?.key);
    const pool = companionLines.length ? companionLines : eligible.filter((line) => line.companionKey === null);
    if (pool.length === 0) return null;
    const available = pool.filter((line) => line.id !== lastLineByTrigger.current[trigger]);
    const options = available.length > 0 ? available : pool;
    const totalWeight = options.reduce((total, line) => total + Math.max(1, line.weight), 0);
    let selection = Math.random() * totalWeight;
    const line = options.find((candidate) => (selection -= Math.max(1, candidate.weight)) < 0) ?? options[0];
    lastLineByTrigger.current[trigger] = line.id;
    if (dialogueTimer.current) clearTimeout(dialogueTimer.current);
    const expiresAt = Date.now() + 4200;
    activeDialogue.current = { priority: priority[trigger], expiresAt, lineId: line.id };
    setDialogueLine(line);
    dialogueTimer.current = setTimeout(() => {
      if (activeDialogue.current?.lineId !== line.id) return;
      activeDialogue.current = null;
      setDialogueLine(null);
    }, 4200);
    return line;
  }, [avatar?.key, companion.data]);
  const react = useCallback((trigger: CompanionDialogueTrigger) => {
    const line = showDialogue(trigger);
    if (line) setReactionKind(line.reaction);
    if (!reduceMotion) reactionMotion.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 320 }));
  }, [reactionMotion, reduceMotion, showDialogue]);
  const reactToUser = () => {
    const now = Date.now();
    if (now - lastTapAt.current < 1200) return;
    lastTapAt.current = now;
    react('tap');
    if (!memoryStarVisible && now - lastStarAt.current > 9000 && Math.random() < 0.32) {
      lastStarAt.current = now;
      setMemoryStarOnLeft(Math.random() > 0.5);
      setMemoryStarCaught(false);
      starMotion.value = 0;
      setMemoryStarVisible(true);
      if (!reduceMotion) starMotion.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
      if (starTimer.current) clearTimeout(starTimer.current);
      starTimer.current = setTimeout(() => {
        cancelAnimation(starMotion);
        setMemoryStarVisible(false);
      }, 3200);
    }
  };
  const catchMemoryStar = () => {
    setMemoryStarVisible(false);
    cancelAnimation(starMotion);
    setMemoryStarCaught(true);
    if (caughtStarTimer.current) clearTimeout(caughtStarTimer.current);
    caughtStarTimer.current = setTimeout(() => setMemoryStarCaught(false), 850);
    if (starTimer.current) clearTimeout(starTimer.current);
    react('star');
  };
  const todayUtc = new Date().toISOString().slice(0, 10);
  const greetedToday = Boolean(companion.data?.memories.some((memory) =>
    memory.type.toLowerCase() === 'greeting' && memory.occurredAt.slice(0, 10) === todayUtc,
  ));
  useEffect(() => {
    if (!isFocused || reduceMotion) {
      cancelAnimation(idleMotion);
      idleMotion.value = 0;
      return;
    }
    idleMotion.value = withRepeat(withSequence(
      withTiming(1, { duration: 1250 }),
      withTiming(-0.35, { duration: 1350 }),
      withTiming(0, { duration: 900 }),
    ), -1, false);
    return () => cancelAnimation(idleMotion);
  }, [idleMotion, isFocused, reduceMotion]);
  useEffect(() => {
    if (!isFocused || !companion.data) return;
    if (lastPracticeMemoryId.current === undefined) {
      lastPracticeMemoryId.current = latestPractice?.id ?? null;
      return;
    }
    if (!latestPractice || latestPractice.id === lastPracticeMemoryId.current) return;
    lastPracticeMemoryId.current = latestPractice.id;
    react('practice');
  }, [companion.data, isFocused, latestPractice, react]);
  useEffect(() => {
    if (!isFocused || !companion.data) return;
    const lookSignature = JSON.stringify(companion.data.look);
    const previous = companionSnapshot.current;
    if (!previous) {
      companionSnapshot.current = { avatarId: companion.data.avatarId, bondStage: companion.data.bondStage, look: lookSignature };
      return;
    }
    if (previous.avatarId !== companion.data.avatarId) {
      companionSnapshot.current = { avatarId: companion.data.avatarId, bondStage: companion.data.bondStage, look: lookSignature };
      return;
    }
    if (previous.bondStage !== companion.data.bondStage) react('bond');
    else if (previous.look !== lookSignature) react('outfit');
    companionSnapshot.current = { avatarId: companion.data.avatarId, bondStage: companion.data.bondStage, look: lookSignature };
  }, [companion.data, isFocused, react]);
  useEffect(() => {
    if (!isFocused) {
      lastBlurAt.current = Date.now();
      return;
    }
    if (lastBlurAt.current !== null && Date.now() - lastBlurAt.current >= 4 * 60 * 60 * 1000) react('return');
    lastBlurAt.current = null;
  }, [isFocused, react]);
  useEffect(() => () => {
    if (dialogueTimer.current) clearTimeout(dialogueTimer.current);
    if (starTimer.current) clearTimeout(starTimer.current);
    if (caughtStarTimer.current) clearTimeout(caughtStarTimer.current);
    cancelAnimation(starMotion);
  }, [starMotion]);
  useEffect(() => {
    if (isFocused) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <LinearGradient colors={[theme.violetTint, '#E7F4FF', '#EFF8F1']} start={{ x: 0.1, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.pageGradient}>
        <View pointerEvents="none" style={styles.sceneDecor}>
          <View style={styles.sceneSun} />
          <View style={[styles.sceneSparkle, styles.sceneSparkleOne]}><Sparkles size={22} color={theme.violetDeep} /></View>
          <View style={[styles.sceneSparkle, styles.sceneSparkleTwo]}><Sparkles size={15} color={theme.sunDeep} /></View>
          <View style={styles.sceneHillBack} />
          <View style={styles.sceneHillFront} />
        </View>
        <CommonHeader
          title={chinese ? '伙伴空间' : 'Companion'}
          description={chinese ? '一起学习，也一起成长' : 'Learn, grow, and keep each other company'}
          backAction={() => router.back()}
          actions={[{ icon: CircleHelp, onPress: () => helpSheetRef.current?.present(), accessibilityLabel: chinese ? '伙伴空间说明' : 'About companion space' }]}
          leftComponent={(
            <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '返回' : 'Go back'} onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.violetDeep} />
            </AnimatedPressable>
          )}
          showAiCredits={false}
          backgroundMode="transparent"
        />
        <ScrollView ref={scrollRef} style={styles.scrollArea} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {companion.isLoading || avatarsLoading ? (
          <View style={styles.centerState} accessibilityRole="progressbar"><ActivityIndicator color={theme.violetDeep} /><Text style={styles.stateText}>{chinese ? '伙伴正在赶来…' : 'Your companion is on the way…'}</Text></View>
        ) : companion.isError ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={38} color={theme.inkMuted} />
            <Text style={styles.stateTitle}>{chinese ? '暂时联系不上伙伴' : 'Can’t reach your companion'}</Text>
            <Text style={styles.stateText}>{chinese ? '稍后再试，伙伴和进度都在等你。' : 'Try again in a moment. Your companion and progress will be here.'}</Text>
            <ActionButton label={chinese ? '重新试试' : 'Try again'} onPress={retry} />
          </View>
        ) : companion.data ? (
          <>
            <View style={styles.companionScene}>
                <View style={[styles.avatarStage, { minHeight: stageHeight }]}>
                  <View style={styles.halo} />
                  <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '轻触伙伴互动' : 'Tap your companion for a little reaction'} accessibilityHint={chinese ? '伙伴会轻轻回应你' : 'Your companion gives a little wiggle hello'} onPress={reactToUser} style={styles.characterTapTarget}>
                    <Animated.View style={[styles.companionFigure, idleStyle]}>
                      <Animated.View style={characterStyle}>
                        {avatar?.companionCharacterImageUrl
                          ? <CompanionCharacterArtwork look={companion.data.look} items={appearanceItems} companionKey={avatar.key} characterImageUrl={avatar.companionCharacterImageUrl} size={artworkSize} accessibilityLabel={chinese ? '伙伴，已穿戴保存的造型' : 'Companion wearing the saved outfit'} />
                          : avatar?.imageUrl
                            ? <CompanionPortraitArtwork imageUrl={avatar.imageUrl} size={Math.min(artworkSize, 300)} accessibilityLabel={chinese ? `${avatar.titleZh}伙伴` : `${avatar.titleEn} companion`} />
                            : <MemoryAvatar avatar={avatar} size={Math.min(240, artworkSize)} level={level} showLevelBadge={false} />}
                      </Animated.View>
                    </Animated.View>
                  </AnimatedPressable>
                  <CompanionSwitcher
                    avatar={avatar}
                    avatars={avatars}
                    level={level}
                    selectedAvatarId={companion.data.avatarId}
                    isPending={selectCompanion.isPending}
                    hasError={selectCompanion.isError}
                    onSelect={(avatarId) => selectCompanion.mutateAsync(avatarId)}
                  />
                  <View style={styles.floatingActions}>
                    <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '陪伙伴复习' : 'Review with your companion'} onPress={openPractice} style={styles.floatingAction}>
                      <Ionicons name="book" size={20} color={theme.violetDeep} />
                    </AnimatedPressable>
                    <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '打开伙伴衣橱换装' : 'Open the companion wardrobe'} onPress={() => router.push('/companion-studio')} style={styles.floatingAction}>
                      <Ionicons name="shirt-outline" size={20} color={theme.violetDeep} />
                    </AnimatedPressable>
                  </View>
                  {memoryStarVisible ? (
                    <Animated.View style={[styles.memoryStarPosition, memoryStarOnLeft ? styles.memoryStarLeft : styles.memoryStarRight, memoryStarMotionStyle]}>
                      <AnimatedPressable
                        accessibilityRole="button"
                        accessibilityLabel={companionT('tapMemoryStar')}
                        accessibilityHint={companionT('tapMemoryStarHint')}
                        onPress={catchMemoryStar}
                        style={styles.memoryStarButton}>
                        <Ionicons name="star" size={23} color={theme.sunDeep} />
                        <View pointerEvents="none" style={styles.memoryStarShine}><Sparkles size={12} color={theme.paper} /></View>
                      </AnimatedPressable>
                      <View pointerEvents="none" style={styles.memoryStarHint}><Text style={styles.memoryStarHintText}>{companionT('tapMemoryStar')}</Text></View>
                    </Animated.View>
                  ) : null}
                  {memoryStarCaught ? (
                    <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.starCaughtFeedback}>
                      <Sparkles size={16} color={theme.sunDeep} />
                      <Text style={styles.starCaughtText}>{companionT('memoryStarCaught')}</Text>
                    </View>
                  ) : null}
                  {dialogueLine ? (
                    <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.dialogueBubble}>
                      <View style={styles.dialogueSparkle}><Sparkles size={14} color={theme.violetDeep} /></View>
                      <Text numberOfLines={2} style={styles.dialogueText}>{chinese ? dialogueLine.textZh : dialogueLine.textEn}</Text>
                      <View style={styles.dialogueTail} />
                    </View>
                  ) : null}
                </View>
                {!greetedToday ? (
                  <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={chinese ? '向伙伴挥手问候，获得 1 点羁绊' : 'Wave hello to your companion and earn 1 bond point'}
                    accessibilityState={{ disabled: greet.isPending }}
                    disabled={greet.isPending}
                    onPress={() => greet.mutate(undefined, { onSuccess: () => {
                      react('greeting');
                    } })}
                    style={styles.greetingBubble}
                  >
                    {greet.isPending ? <ActivityIndicator size="small" color={theme.violetDeep} /> : <Ionicons name="hand-left-outline" size={25} color={theme.violetDeep} />}
                    <View pointerEvents="none" style={styles.greetingBubbleTail} />
                  </AnimatedPressable>
                ) : null}
                {greet.isError ? <Text style={styles.inlineError} accessibilityRole="alert">{chinese ? '招呼没有送达，请再试一次。' : 'Your hello didn’t get through. Try again.'}</Text> : null}
                <View style={styles.compactBondPanel}>
                  <View style={styles.bondHeader}>
                    <View style={styles.bondTitleRow}>
                      <View><Text style={styles.bondCaption}>{chinese ? '羁绊等级' : 'BOND LEVEL'}</Text><Text style={styles.stage}>{currentBondStage ? (chinese ? currentBondStage.titleZh : currentBondStage.titleEn) : companion.data.bondStage}</Text></View>
                    </View>
                    <View style={styles.pointsBadge}><Sparkles size={12} color={theme.violetDeep} /><Text style={styles.pointsText}>{companion.data.bondPoints}</Text></View>
                  </View>
                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTarget}>{companion.data.bondToNextStage > 0
                        ? (chinese ? `下一阶段  ${nextBondStage ? nextBondStage.titleZh : ''}` : `NEXT  ${nextBondStage ? nextBondStage.titleEn : ''}`)
                        : (chinese ? '最高羁绊' : 'MAX BOND')}</Text>
                      <Text style={styles.progressRemaining}>{companion.data.bondToNextStage > 0
                        ? (chinese ? `还差 ${companion.data.bondToNextStage} 点` : `${companion.data.bondToNextStage} pts left`)
                        : (chinese ? '已满级' : 'Complete')}</Text>
                    </View>
                    <View accessibilityRole="progressbar" accessibilityLabel={chinese ? '当前羁绊进度' : 'Current bond progress'} accessibilityValue={{ min: 0, max: 100, now: Math.max(0, Math.min(100, companion.data.bondProgress)) }} style={styles.progressTrack}>
                      <LinearGradient colors={[theme.violetDeep, '#8D78EA', '#B19BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, companion.data.bondProgress))}%` }]} />
                    </View>
                  </View>
                </View>
            </View>

          </>
        ) : null}
        </ScrollView>
        <CompanionHelpSheet ref={helpSheetRef} />
      </LinearGradient>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" onPress={onPress} style={styles.retryButton}><Text style={styles.retryText}>{label}</Text></AnimatedPressable>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.violetTint }, pageGradient: { flex: 1 }, backButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }, scrollArea: { flex: 1 }, content: { flexGrow: 1, padding: 0 }, companionScene: { flex: 1, minHeight: 560, justifyContent: 'flex-start', paddingHorizontal: 18, paddingTop: 4 }, sceneDecor: { ...StyleSheet.absoluteFillObject, zIndex: 0 }, sceneSun: { position: 'absolute', top: 150, left: 28, width: 190, height: 190, borderRadius: 100, backgroundColor: theme.paper, opacity: 0.34 }, sceneSparkle: { position: 'absolute', opacity: 0.72 }, sceneSparkleOne: { top: 235, left: 26 }, sceneSparkleTwo: { top: 315, right: 80 }, sceneHillBack: { position: 'absolute', left: -55, right: -60, bottom: -135, height: 250, borderRadius: 180, backgroundColor: theme.paper, opacity: 0.23 }, sceneHillFront: { position: 'absolute', left: 100, right: -110, bottom: -180, height: 260, borderRadius: 180, backgroundColor: theme.mintTint, opacity: 0.55 },
  avatarStage: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'visible', zIndex: 1 }, characterTapTarget: { minWidth: 220, minHeight: 220, alignItems: 'center', justifyContent: 'center' }, halo: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: theme.violetTint, opacity: 0.58 }, companionFigure: { alignItems: 'center', justifyContent: 'center' }, floatingActions: { position: 'absolute', top: 14, right: -8, gap: 11, zIndex: 2 }, floatingAction: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: theme.violetLine, boxShadow: '0px 3px 10px rgba(43,42,61,0.10)' },
  memoryStarPosition: { position: 'absolute', top: '47%', zIndex: 7, elevation: 7, alignItems: 'center' }, memoryStarLeft: { left: '1%' }, memoryStarRight: { right: '1%' }, memoryStarButton: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, borderWidth: 2, borderColor: theme.sunLine, backgroundColor: theme.sunTint, boxShadow: '0px 4px 12px rgba(43,42,61,0.18)' }, memoryStarShine: { position: 'absolute', top: 5, right: 4 }, memoryStarHint: { marginTop: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.92)' }, memoryStarHintText: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 }, starCaughtFeedback: { position: 'absolute', top: '45%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: theme.sunLine }, starCaughtText: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, dialogueBubble: { position: 'absolute', top: '14%', left: '14%', right: 65, zIndex: 6, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 18, borderBottomLeftRadius: 7, borderWidth: 1, borderColor: theme.violetLine, backgroundColor: 'rgba(255,255,255,0.97)', boxShadow: '0px 5px 16px rgba(43,42,61,0.15)' }, dialogueSparkle: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: theme.violetTint }, dialogueText: { flex: 1, color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 17 }, dialogueTail: { position: 'absolute', left: 14, bottom: -5, width: 10, height: 10, transform: [{ rotate: '45deg' }], borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.violetLine, backgroundColor: theme.paper },
  reactionBubble: { minHeight: 34, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 6, marginTop: -4, borderRadius: 14, backgroundColor: theme.violetTint }, reaction: { flexShrink: 1, textAlign: 'center', color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 12 }, greetingButton: { minHeight: 66, minWidth: 250, maxWidth: 310, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, marginBottom: 8, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 21, borderWidth: 1.5, borderColor: theme.sunLine, backgroundColor: theme.paper, boxShadow: '0px 5px 14px rgba(43,42,61,0.10)' }, greetingButtonDone: { borderColor: theme.mintLine, backgroundColor: theme.mintTint }, greetingWave: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.sunTint }, greetingWaveDone: { backgroundColor: theme.paper }, greetingCopy: { flex: 1 }, greetingTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, greetingSubtitle: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 9, marginTop: 3 }, greetingPoints: { minWidth: 35, height: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: 15, backgroundColor: theme.sunTint }, greetingPointsDone: { backgroundColor: theme.paper }, greetingPointsText: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, greetingPointsTextDone: { color: theme.grass }, bondPanel: { minHeight: 260, justifyContent: 'center', gap: 13, marginHorizontal: -18, marginTop: 'auto', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0px -7px 22px rgba(43,42,61,0.08)' }, bondHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, bondTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, bondSparkle: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint }, stage: { color: theme.ink, fontFamily: typography.display, fontSize: 20 }, bondCaption: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.5, marginTop: 1 }, pointsBadge: { minWidth: 54, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 18, backgroundColor: theme.violetTint }, pointsText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 }, bondJourney: { height: 72, justifyContent: 'flex-start', position: 'relative', marginTop: 0, paddingTop: 8, paddingBottom: 5, paddingHorizontal: 7, borderRadius: 19, backgroundColor: theme.violetTint }, journeyRail: { position: 'absolute', top: 19, left: '12.5%', right: '12.5%', height: 4, borderRadius: 2, backgroundColor: theme.violetLine }, journeyProgress: { position: 'absolute', top: 19, left: '12.5%', height: 4, maxWidth: '75%', borderRadius: 2, backgroundColor: theme.violetDeep }, milestones: { flexDirection: 'row', justifyContent: 'space-between' }, milestone: { width: '25%', alignItems: 'center', gap: 5 }, milestoneDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.violetLine }, milestoneDotReached: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep }, milestoneLabel: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 9 }, milestoneLabelCurrent: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold }, bondFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, nextStageBadge: { minHeight: 34, flex: 1, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, backgroundColor: theme.sand }, nextStageText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 10 }, bondRewards: { flexDirection: 'row', gap: 6 }, rewardChip: { minWidth: 42, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: theme.violetTint }, bondReward: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  greetingBubble: { width: 52, height: 52, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12, borderRadius: 21, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper, boxShadow: '0px 4px 12px rgba(43,42,61,0.10)' }, greetingBubbleTail: { position: 'absolute', right: 7, bottom: -4, width: 10, height: 10, transform: [{ rotate: '45deg' }], borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper }, compactBondPanel: { minHeight: 176, justifyContent: 'center', gap: 15, marginHorizontal: -18, marginTop: 'auto', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0px -7px 22px rgba(43,42,61,0.08)' }, progressCard: { gap: 10 }, progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, progressTarget: { flexShrink: 1, color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 11 }, progressRemaining: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, progressTrack: { height: 10, borderRadius: 6, overflow: 'hidden', backgroundColor: theme.violetTint }, progressFill: { height: '100%', borderRadius: 6 },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 22, backgroundColor: theme.sand, borderWidth: 1, borderColor: theme.peachLine }, todayIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint }, todayCopy: { flex: 1 }, todayTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 16, marginTop: 4 }, todaySub: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, marginTop: 3 },
  inlineError: { color: theme.berryDeep, textAlign: 'center', fontFamily: typography.body, fontSize: 11 },
  recentResponse: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18, backgroundColor: theme.sunTint, borderWidth: 1, borderColor: theme.sunLine }, responseIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper }, responseCopy: { flex: 1 }, responseEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.8 }, responseText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 16, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, sectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17 }, memoryCount: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, backgroundColor: theme.violetTint, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 }, memoryCard: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 18, backgroundColor: theme.paper }, memoryIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: theme.sunTint, alignItems: 'center', justifyContent: 'center' }, memoryCopy: { flex: 1 }, memorySummary: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12 }, memoryDate: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 4 }, emptyCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 18, backgroundColor: theme.paper }, emptyText: { flex: 1, color: theme.inkSoft, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  centerState: { minHeight: 330, alignItems: 'center', justifyContent: 'center', gap: 12 }, stateCard: { minHeight: 290, justifyContent: 'center', alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: theme.paper }, stateEmoji: { fontSize: 42 }, stateTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 12, textAlign: 'center' }, stateText: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 }, retryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 15, backgroundColor: theme.violetDeep, marginTop: 16 }, retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
