import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useMemoryModuleAccess } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { useDueMemoryReviews, type DueMemoryReview } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { WeeklyActivityCard } from '@/features/gamification/shared/components/WeeklyActivityCard';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Plus } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeHeader } from '../components/Header/HomeHeader';
import { TodayReviewCard } from '../components/TodayReviewCard';
import { useTranslation } from '@/core/i18n/useTranslation';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const { user } = useCurrentUser();
  const { enabled: palaceEnabled } = useMemoryModuleAccess('palace');
  const { enabled: numberPegEnabled } = useMemoryModuleAccess('number-peg');
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const activityQuery = useXpEvents({ recentDays: 7 });
  const memorySet = (memorySets.data ?? [])
    .filter((item) => item.status !== 'archived')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const streak = Math.max(0, user?.stats?.currentStreak ?? 0);
  const stats = user?.stats;
  const canStartNumberPeg = numberPegEnabled || !palaceEnabled;

  const refreshHome = async () => {
    await Promise.allSettled([memorySets.refetch(), activityQuery.refetch()]);
  };

  return (
    <View style={styles.page}>
      <HomeHeader
        userData={user ?? {
          id: 'guest',
          displayName: 'Guest',
          email: 'guest@local',
          totalXp: 0,
          level: 1,
          isPremium: false,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching || activityQuery.isFetching} onRefresh={refreshHome} />}
        contentContainerStyle={styles.content}>
        <View style={styles.streakBanner}>
          <View style={styles.streakCopyRow}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
            <Text style={styles.streakTitle}>{streak} {t('streak')}</Text>
              <Text style={styles.streakSubtitle}>{t('streakSubtitle')}</Text>
            </View>
          </View>
          <View style={styles.streakDots} accessibilityLabel={`${streak} day streak`}>
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} style={[styles.streakDot, index < Math.min(7, streak) && styles.streakDotOn]} />
            ))}
          </View>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description={t('loading')} /></View>
        ) : memorySets.isError ? (
          <ModuleNoticeCard
            title={t('recentError')}
            body={t('retry')}
            onAction={memorySets.refetch}
          />
        ) : memorySet ? (
          <ContinueSessionCardShim memorySet={memorySet} onPress={() => router.push(`/memory-details/${memorySet.id}`)} />
        ) : (
          <ModuleNoticeCard
            icon={<Text style={styles.emptyIconEmoji}>✨</Text>}
            title={t('newSession')}
            body={t('newSessionBody')}
            actionLabel={t('tapToStart')}
            actionIcon={<Plus size={15} color="#2B2A3D" />}
            onAction={() => router.push('/create-memory' as Href)}
          />
        )}

        {dueReviews.data?.length ? (
          <TodayReviewCard
            reviews={dueReviews.data}
            onOpen={(review) => openReview(router, review)}
            onStartReview={(review) => openReview(router, review)}
          />
        ) : null}

        <Text style={styles.sectionLabel}>{t('todaysPick')}</Text>
        <AnimatedPressable
          onPress={() => router.push(canStartNumberPeg ? '/number-peg/create' : '/palaces/create-memory')}
          style={styles.todayCard}>
          <LinearGradient colors={['#FFF7E0', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayGradient}>
            <Text style={styles.todayIcon}>🕯️</Text>
            <View style={styles.todayBody}>
              <Text style={styles.todayTitle}>{t('todayTitle')}</Text>
              <Text style={styles.todaySubtitle}>
                {canStartNumberPeg ? t('todaySubtitlePeg') : t('todaySubtitlePalace')}
              </Text>
            </View>
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>{t('start')}</Text>
            </View>
          </LinearGradient>
        </AnimatedPressable>

        <Text style={styles.sectionLabel}>{t('thisWeek')}</Text>
        <View style={styles.statRow}>
          <StatTile value={`${stats?.lessonsCompleted ?? 0}`} label={t('sessions')} />
          <StatTile value={`${stats?.wordsLearned ?? 0}`} label={t('words')} />
          <StatTile value="—" label={t('accuracy')} />
        </View>

        <WeeklyActivityCard title={t('weekActivity')} events={activityQuery.events} />

        <MemoryTipCard />
      </ScrollView>
    </View>
  );
}

function openReview(router: ReturnType<typeof useRouter>, review: DueMemoryReview) {
  const route = review.techniqueKey === 'palace'
    ? `/palaces/memory/${review.memorySetId}?mode=recall`
    : `/number-peg/${review.memorySetId}?mode=recall`;
  router.push(route as Href);
}

const MEMORY_TIPS = [
  { title: 'Make it bizarre', body: 'Strange, oversized images are easier to recall than ordinary ones.', emoji: '🎨' },
  { title: 'Use every sense', body: 'Add a sound, texture, or smell to make your memory scene vivid.', emoji: '✨' },
  { title: 'Keep the route steady', body: 'Use the same order every time you walk through a Memory Palace.', emoji: '🚶' },
  { title: 'Review before you forget', body: 'A quick recall today makes the next review much easier.', emoji: '🔁' },
];

function MemoryTipCard() {
  const { t } = useTranslation('home');
  const tip = MEMORY_TIPS[(new Date().getDate() - 1) % MEMORY_TIPS.length];
  const tipIndex = (new Date().getDate() - 1) % MEMORY_TIPS.length + 1;
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
      <View style={styles.tipCopy}>
      <Text style={styles.tipEyebrow}>{t('memoryTip')}</Text>
        <Text style={styles.tipTitle}>{t(`tip${tipIndex}Title` as 'tip1Title')}</Text>
        <Text style={styles.tipBody}>{t(`tip${tipIndex}Body` as 'tip1Body')}</Text>
      </View>
    </View>
  );
}

function ContinueSessionCardShim({ memorySet, onPress }: { memorySet: MemorySet; onPress: () => void }) {
  const { t } = useTranslation('home');
  const isPalace = memorySet.techniqueKey === 'palace';
  const progress = memorySet.status === 'draft' ? 25 : 100;

  return (
    <AnimatedPressable onPress={onPress} style={styles.continueCard}>
      <View style={[styles.techniqueBadge, isPalace ? styles.palaceBadge : styles.pegBadge]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.continueBody}>
        <Text style={styles.continueLabel}>{t('continue')}</Text>
        <Text numberOfLines={1} style={styles.continueTitle}>{memorySet.title}</Text>
        <View style={styles.continueTrack}><View style={[styles.continueFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.continueMeta}>
          {memorySet.status === 'draft' ? t('keepBuilding') : `1 of ${memorySet.items.length} ${t('recalled')}`}
        </Text>
      </View>
      <ArrowRight size={18} color="#6B6A80" />
    </AnimatedPressable>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 128 },
  streakBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF3D6', borderWidth: 2, borderColor: '#FFE3AE', borderRadius: 18, paddingVertical: 13, paddingHorizontal: 15, marginBottom: 16 },
  streakCopyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  streakFlame: { fontSize: 26 },
  streakTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  streakSubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  streakDots: { flexDirection: 'row', gap: 4 },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EEE9DC' },
  streakDotOn: { backgroundColor: '#F2A900' },
  emptyIconEmoji: { fontSize: 24 },
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 18, padding: 13, boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  techniqueBadge: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  techniqueEmoji: { fontSize: 21, lineHeight: 25 },
  palaceBadge: { backgroundColor: '#EEE9FF' },
  pegBadge: { backgroundColor: '#FFF0F4' },
  continueBody: { flex: 1, minWidth: 0 },
  continueLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5 },
  continueTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 1, marginBottom: 6 },
  continueTrack: { height: 6, backgroundColor: '#EEE9DC', borderRadius: 999, overflow: 'hidden' },
  continueFill: { height: '100%', backgroundColor: '#9B8CFF', borderRadius: 999 },
  continueMeta: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 5 },
  sectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  todayCard: { borderWidth: 2, borderColor: '#FFE6A3', borderRadius: 18, overflow: 'hidden', boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  todayGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  todayIcon: { fontSize: 26 },
  todayBody: { flex: 1, minWidth: 0 },
  todayTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 13.5 },
  todaySubtitle: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11, marginTop: 2 },
  startButton: { backgroundColor: '#FFC93C', borderRadius: 11, paddingHorizontal: 14, paddingVertical: 9 },
  startButtonText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 12 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8 },
  statValue: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10.5, marginTop: 2 },
  loadingFrame: { height: 145, borderRadius: 18, overflow: 'hidden' },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F7F5FF', borderWidth: 2, borderColor: '#E0D9FF', borderRadius: 18, padding: 14, marginTop: 22 },
  tipEmoji: { fontSize: 24, lineHeight: 30 },
  tipCopy: { flex: 1 },
  tipEyebrow: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  tipTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  tipBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
});
