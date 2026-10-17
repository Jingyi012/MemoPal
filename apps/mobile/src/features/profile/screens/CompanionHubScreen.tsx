import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { MemoryAvatar } from '@/components/MemoryAvatar';
import { CompanionCharacterArtwork } from '../components/CompanionCharacterArtwork';
import CompanionHelpSheet from '../components/CompanionHelpSheet';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useCompanion, useGreetCompanion } from '@/features/profile/hooks/useCompanion';
import { getEquippedAvatar, useAvatars } from '@/features/avatars/hooks/useAvatars';
import { useAppearance } from '@/features/appearance/hooks/useAppearance';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CircleHelp, Sparkles } from '@/core/icons';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

const STAGE_LABELS: Record<string, [string, string]> = {
  new: ['Just met', '初识'],
  familiar: ['Getting familiar', '熟悉'],
  in_sync: ['In sync', '默契'],
  best_friends: ['Best friends', '挚友'],
};
const BOND_STAGES = ['new', 'familiar', 'in_sync', 'best_friends'] as const;

export default function CompanionHubScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { language } = useTranslation('profile');
  const chinese = language === 'zh';
  const { user } = useCurrentUser();
  const { avatars, isLoading: avatarsLoading } = useAvatars();
  const { items: appearanceItems } = useAppearance();
  const companion = useCompanion();
  const greet = useGreetCompanion();
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
  const idleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * idleMotion.value }, { rotate: `${idleMotion.value}deg` }],
  }));
  const characterStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -8 * reactionMotion.value },
      { rotate: `${-3 * reactionMotion.value}deg` },
      { scale: 1 + 0.035 * reactionMotion.value },
    ],
  }));
  const level = useLevelByXp(Math.max(0, user?.totalXp ?? 0), user?.level).levelInfo?.currentLevel ?? user?.level ?? 1;
  const avatar = getEquippedAvatar(avatars, companion.data?.avatarId ?? user?.selectedAvatarId, level);
  const bondStageIndex = Math.max(0, BOND_STAGES.indexOf((companion.data?.bondStage ?? 'new') as typeof BOND_STAGES[number]));
  const nextBondStage = BOND_STAGES[Math.min(BOND_STAGES.length - 1, bondStageIndex + 1)];

  const retry = () => { void companion.refetch(); };
  const openPractice = () => router.push('/practice');
  const latestPractice = useMemo(() => companion.data?.memories
    .filter((memory) => /practice|review/i.test(memory.type) && (chinese ? memory.summaryZh : memory.summaryEn).trim())
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))[0], [companion.data?.memories, chinese]);
  const reactToUser = () => {
    const now = Date.now();
    if (now - lastTapAt.current < 1200) return;
    lastTapAt.current = now;
    if (!reduceMotion) reactionMotion.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 300 }));
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
    if (!reduceMotion) reactionMotion.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 320 }));
  }, [companion.data, isFocused, latestPractice, reduceMotion, reactionMotion]);
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
                        {avatar?.assetKey === 'memory-owl'
                          ? <CompanionCharacterArtwork look={companion.data.look} items={appearanceItems} avatarId={companion.data.avatarId} size={artworkSize} accessibilityLabel={chinese ? '伙伴，已穿戴保存的造型' : 'Companion wearing the saved outfit'} />
                          : <MemoryAvatar avatar={avatar} size={Math.min(240, artworkSize)} level={level} showLevelBadge={false} />}
                      </Animated.View>
                    </Animated.View>
                  </AnimatedPressable>
                  <View style={styles.floatingActions}>
                    <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '陪伙伴复习' : 'Review with your companion'} onPress={openPractice} style={styles.floatingAction}>
                      <Ionicons name="book" size={20} color={theme.violetDeep} />
                    </AnimatedPressable>
                    <AnimatedPressable accessibilityRole="button" accessibilityLabel={chinese ? '打开伙伴衣橱换装' : 'Open the companion wardrobe'} onPress={() => router.push('/companion-studio')} style={styles.floatingAction}>
                      <Ionicons name="shirt-outline" size={20} color={theme.violetDeep} />
                    </AnimatedPressable>
                  </View>
                </View>
                {!greetedToday ? (
                  <AnimatedPressable
                    accessibilityRole="button"
                    accessibilityLabel={chinese ? '向伙伴挥手问候，获得 1 点羁绊' : 'Wave hello to your companion and earn 1 bond point'}
                    accessibilityState={{ disabled: greet.isPending }}
                    disabled={greet.isPending}
                    onPress={() => greet.mutate(undefined, { onSuccess: () => {
                      if (!reduceMotion) reactionMotion.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 300 }));
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
                      <View><Text style={styles.bondCaption}>{chinese ? '羁绊等级' : 'BOND LEVEL'}</Text><Text style={styles.stage}>{stageLabel(companion.data.bondStage, chinese)}</Text></View>
                    </View>
                    <View style={styles.pointsBadge}><Sparkles size={12} color={theme.violetDeep} /><Text style={styles.pointsText}>{companion.data.bondPoints}</Text></View>
                  </View>
                  <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressTarget}>{companion.data.bondToNextStage > 0
                        ? (chinese ? `下一阶段  ${stageLabel(nextBondStage, true)}` : `NEXT  ${stageLabel(nextBondStage, false)}`)
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

function stageLabel(stage: string, chinese: boolean) {
  const labels = STAGE_LABELS[stage.toLowerCase()];
  return labels ? labels[chinese ? 1 : 0] : stage;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.violetTint }, pageGradient: { flex: 1 }, backButton: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.78)' }, scrollArea: { flex: 1 }, content: { flexGrow: 1, padding: 0 }, companionScene: { flex: 1, minHeight: 560, justifyContent: 'flex-start', paddingHorizontal: 18, paddingTop: 4 }, sceneDecor: { ...StyleSheet.absoluteFillObject, zIndex: 0 }, sceneSun: { position: 'absolute', top: 150, left: 28, width: 190, height: 190, borderRadius: 100, backgroundColor: theme.paper, opacity: 0.34 }, sceneSparkle: { position: 'absolute', opacity: 0.72 }, sceneSparkleOne: { top: 235, left: 26 }, sceneSparkleTwo: { top: 315, right: 80 }, sceneHillBack: { position: 'absolute', left: -55, right: -60, bottom: -135, height: 250, borderRadius: 180, backgroundColor: theme.paper, opacity: 0.23 }, sceneHillFront: { position: 'absolute', left: 100, right: -110, bottom: -180, height: 260, borderRadius: 180, backgroundColor: theme.mintTint, opacity: 0.55 },
  avatarStage: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'visible', zIndex: 1 }, characterTapTarget: { minWidth: 220, minHeight: 220, alignItems: 'center', justifyContent: 'center' }, halo: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: theme.violetTint, opacity: 0.58 }, companionFigure: { alignItems: 'center', justifyContent: 'center' }, floatingActions: { position: 'absolute', top: 14, right: -8, gap: 11, zIndex: 2 }, floatingAction: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: theme.violetLine, boxShadow: '0px 3px 10px rgba(43,42,61,0.10)' },
  reactionBubble: { minHeight: 34, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 6, marginTop: -4, borderRadius: 14, backgroundColor: theme.violetTint }, reaction: { flexShrink: 1, textAlign: 'center', color: theme.violetDeep, fontFamily: typography.bodyBold, fontSize: 12 }, greetingButton: { minHeight: 66, minWidth: 250, maxWidth: 310, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, marginBottom: 8, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 21, borderWidth: 1.5, borderColor: theme.sunLine, backgroundColor: theme.paper, boxShadow: '0px 5px 14px rgba(43,42,61,0.10)' }, greetingButtonDone: { borderColor: theme.mintLine, backgroundColor: theme.mintTint }, greetingWave: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.sunTint }, greetingWaveDone: { backgroundColor: theme.paper }, greetingCopy: { flex: 1 }, greetingTitle: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 12 }, greetingSubtitle: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 9, marginTop: 3 }, greetingPoints: { minWidth: 35, height: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderRadius: 15, backgroundColor: theme.sunTint }, greetingPointsDone: { backgroundColor: theme.paper }, greetingPointsText: { color: theme.sunDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, greetingPointsTextDone: { color: theme.grass }, bondPanel: { minHeight: 260, justifyContent: 'center', gap: 13, marginHorizontal: -18, marginTop: 'auto', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0px -7px 22px rgba(43,42,61,0.08)' }, bondHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, bondTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, bondSparkle: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.violetTint }, stage: { color: theme.ink, fontFamily: typography.display, fontSize: 20 }, bondCaption: { color: theme.inkMuted, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.5, marginTop: 1 }, pointsBadge: { minWidth: 54, height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 18, backgroundColor: theme.violetTint }, pointsText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 13 }, bondJourney: { height: 72, justifyContent: 'flex-start', position: 'relative', marginTop: 0, paddingTop: 8, paddingBottom: 5, paddingHorizontal: 7, borderRadius: 19, backgroundColor: theme.violetTint }, journeyRail: { position: 'absolute', top: 19, left: '12.5%', right: '12.5%', height: 4, borderRadius: 2, backgroundColor: theme.violetLine }, journeyProgress: { position: 'absolute', top: 19, left: '12.5%', height: 4, maxWidth: '75%', borderRadius: 2, backgroundColor: theme.violetDeep }, milestones: { flexDirection: 'row', justifyContent: 'space-between' }, milestone: { width: '25%', alignItems: 'center', gap: 5 }, milestoneDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, borderWidth: 2, borderColor: theme.violetLine }, milestoneDotReached: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep }, milestoneLabel: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 9 }, milestoneLabelCurrent: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold }, bondFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, nextStageBadge: { minHeight: 34, flex: 1, justifyContent: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12, backgroundColor: theme.sand }, nextStageText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 10 }, bondRewards: { flexDirection: 'row', gap: 6 }, rewardChip: { minWidth: 42, height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8, borderRadius: 12, backgroundColor: theme.violetTint }, bondReward: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  greetingBubble: { width: 52, height: 52, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12, borderRadius: 21, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper, boxShadow: '0px 4px 12px rgba(43,42,61,0.10)' }, greetingBubbleTail: { position: 'absolute', right: 7, bottom: -4, width: 10, height: 10, transform: [{ rotate: '45deg' }], borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.paper }, compactBondPanel: { minHeight: 176, justifyContent: 'center', gap: 15, marginHorizontal: -18, marginTop: 'auto', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 28, backgroundColor: theme.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0px -7px 22px rgba(43,42,61,0.08)' }, progressCard: { gap: 10 }, progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, progressTarget: { flexShrink: 1, color: theme.inkMuted, fontFamily: typography.bodyBold, fontSize: 11 }, progressRemaining: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 }, progressTrack: { height: 10, borderRadius: 6, overflow: 'hidden', backgroundColor: theme.violetTint }, progressFill: { height: '100%', borderRadius: 6 },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 22, backgroundColor: theme.sand, borderWidth: 1, borderColor: theme.peachLine }, todayIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.mintTint }, todayCopy: { flex: 1 }, todayTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 16, marginTop: 4 }, todaySub: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 11, marginTop: 3 },
  inlineError: { color: theme.berryDeep, textAlign: 'center', fontFamily: typography.body, fontSize: 11 },
  recentResponse: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18, backgroundColor: theme.sunTint, borderWidth: 1, borderColor: theme.sunLine }, responseIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper }, responseCopy: { flex: 1 }, responseEyebrow: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 0.8 }, responseText: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 16, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, sectionTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 17 }, memoryCount: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, backgroundColor: theme.violetTint, overflow: 'hidden', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 }, memoryCard: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 18, backgroundColor: theme.paper }, memoryIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: theme.sunTint, alignItems: 'center', justifyContent: 'center' }, memoryCopy: { flex: 1 }, memorySummary: { color: theme.ink, fontFamily: typography.bodyBold, fontSize: 12 }, memoryDate: { color: theme.inkMuted, fontFamily: typography.body, fontSize: 10, marginTop: 4 }, emptyCard: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 18, backgroundColor: theme.paper }, emptyText: { flex: 1, color: theme.inkSoft, fontFamily: typography.body, fontSize: 12, lineHeight: 18 },
  centerState: { minHeight: 330, alignItems: 'center', justifyContent: 'center', gap: 12 }, stateCard: { minHeight: 290, justifyContent: 'center', alignItems: 'center', padding: 24, borderRadius: 24, backgroundColor: theme.paper }, stateEmoji: { fontSize: 42 }, stateTitle: { color: theme.ink, fontFamily: typography.display, fontSize: 18, marginTop: 12, textAlign: 'center' }, stateText: { color: theme.inkSoft, fontFamily: typography.body, fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 8 }, retryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: 15, backgroundColor: theme.violetDeep, marginTop: 16 }, retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
}));
