import AnimatedPressable from '@/components/AnimatedPressable';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useMemoryModuleAccess } from '@/core/memory';
import { useMemorySets } from '@/features/memory-sets';
import type { MemorySet } from '@/features/memory-sets/types/memorySet.types';
import { useDueMemoryReviews, type DueMemoryReview } from '@/features/practice-attempts';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeHeader } from '../components/Header/HomeHeader';
import { TodayReviewCard } from '../components/TodayReviewCard';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { enabled: palaceEnabled } = useMemoryModuleAccess('palace');
  const { enabled: numberPegEnabled } = useMemoryModuleAccess('number-peg');
  const memorySets = useMemorySets();
  const dueReviews = useDueMemoryReviews();
  const memorySet = (memorySets.data ?? [])
    .filter((item) => item.status !== 'archived')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
  const streak = Math.max(0, user?.stats?.currentStreak ?? 0);
  const stats = user?.stats;
  const canStartNumberPeg = numberPegEnabled || !palaceEnabled;

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
        refreshControl={<RefreshControl refreshing={memorySets.isRefetching} onRefresh={memorySets.refetch} />}
        contentContainerStyle={styles.content}>
        <View style={styles.streakBanner}>
          <View style={styles.streakCopyRow}>
            <Text style={styles.streakFlame}>🔥</Text>
            <View>
              <Text style={styles.streakTitle}>{streak}-day streak</Text>
              <Text style={styles.streakSubtitle}>Practice today to keep it alive</Text>
            </View>
          </View>
          <View style={styles.streakDots} accessibilityLabel={`${streak} day streak`}>
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} style={[styles.streakDot, index < Math.min(7, streak) && styles.streakDotOn]} />
            ))}
          </View>
        </View>

        {memorySets.isLoading ? (
          <View style={styles.loadingFrame}><LoadingView description="Finding your latest memory…" /></View>
        ) : memorySets.isError ? (
          <ModuleNoticeCard
            title="Your recent memory is out of reach"
            body="Check your connection and try again."
            onAction={memorySets.refetch}
          />
        ) : memorySet ? (
          <ContinueSessionCardShim memorySet={memorySet} onPress={() => router.push(`/memory-details/${memorySet.id}`)} />
        ) : (
          <FirstMemoryCard onPress={() => router.push('/create-memory')} />
        )}

        {dueReviews.data?.length ? (
          <TodayReviewCard
            reviews={dueReviews.data}
            onOpen={(review) => openReview(router, review)}
            onStartReview={(review) => openReview(router, review)}
          />
        ) : null}

        <Text style={styles.sectionLabel}>Today&apos;s pick</Text>
        <AnimatedPressable
          onPress={() => router.push(canStartNumberPeg ? '/number-peg/create' : '/palaces/create-memory')}
          style={styles.todayCard}>
          <LinearGradient colors={['#FFF7E0', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.todayGradient}>
            <Text style={styles.todayIcon}>🕯️</Text>
            <View style={styles.todayBody}>
              <Text style={styles.todayTitle}>5 Tricky Spelling Words</Text>
              <Text style={styles.todaySubtitle}>
                A fresh {canStartNumberPeg ? 'Number Peg' : 'Memory Palace'} set, ready in one tap
              </Text>
            </View>
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>Start</Text>
            </View>
          </LinearGradient>
        </AnimatedPressable>

        <Text style={styles.sectionLabel}>This week</Text>
        <View style={styles.statRow}>
          <StatTile value={`${stats?.lessonsCompleted ?? 0}`} label="Sessions" />
          <StatTile value={`${stats?.wordsLearned ?? 0}`} label="Words" />
          <StatTile value="—" label="Accuracy" />
        </View>

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

function FirstMemoryCard({ onPress }: { onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} style={styles.firstMemoryCard}>
      <LinearGradient colors={['#EEE9FF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.firstMemoryGradient}>
        <Text style={styles.firstMemoryEmoji}>🧠</Text>
        <Text style={styles.firstMemoryTitle}>Build your first memory</Text>
        <Text style={styles.firstMemoryBody}>Turn five words into a tiny story in under two minutes.</Text>
        <View style={styles.firstMemoryButton}><Text style={styles.firstMemoryButtonText}>Create a memory</Text><ArrowRight size={16} color="#2B2A3D" /></View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const MEMORY_TIPS = [
  { title: 'Make it bizarre', body: 'Strange, oversized images are easier to recall than ordinary ones.', emoji: '🎨' },
  { title: 'Use every sense', body: 'Add a sound, texture, or smell to make your memory scene vivid.', emoji: '✨' },
  { title: 'Keep the route steady', body: 'Use the same order every time you walk through a Memory Palace.', emoji: '🚶' },
  { title: 'Review before you forget', body: 'A quick recall today makes the next review much easier.', emoji: '🔁' },
];

function MemoryTipCard() {
  const tip = MEMORY_TIPS[(new Date().getDate() - 1) % MEMORY_TIPS.length];
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
      <View style={styles.tipCopy}>
        <Text style={styles.tipEyebrow}>MEMORY TIP</Text>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipBody}>{tip.body}</Text>
      </View>
    </View>
  );
}

function ContinueSessionCardShim({ memorySet, onPress }: { memorySet: MemorySet; onPress: () => void }) {
  const isPalace = memorySet.techniqueKey === 'palace';
  const progress = memorySet.status === 'draft' ? 25 : 100;

  return (
    <AnimatedPressable onPress={onPress} style={styles.continueCard}>
      <View style={[styles.techniqueBadge, isPalace ? styles.palaceBadge : styles.pegBadge]}>
        <Text style={styles.techniqueEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
      </View>
      <View style={styles.continueBody}>
        <Text style={styles.continueLabel}>Continue where you left off</Text>
        <Text numberOfLines={1} style={styles.continueTitle}>{memorySet.title}</Text>
        <View style={styles.continueTrack}><View style={[styles.continueFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.continueMeta}>
          {memorySet.status === 'draft' ? 'Keep building' : `1 of ${memorySet.items.length} recalled`}
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
  firstMemoryCard: { borderWidth: 2, borderColor: '#E0D9FF', borderRadius: 20, overflow: 'hidden', boxShadow: '0px 8px 20px rgba(43,42,61,0.08)' },
  firstMemoryGradient: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 18 },
  firstMemoryEmoji: { fontSize: 34, lineHeight: 40 },
  firstMemoryTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 16.5, marginTop: 5 },
  firstMemoryBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12, textAlign: 'center', marginTop: 3 },
  firstMemoryButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFC93C', borderRadius: 12, paddingHorizontal: 14, marginTop: 13 },
  firstMemoryButtonText: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 12 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F7F5FF', borderWidth: 2, borderColor: '#E0D9FF', borderRadius: 18, padding: 14, marginTop: 22 },
  tipEmoji: { fontSize: 28, lineHeight: 34 },
  tipCopy: { flex: 1 },
  tipEyebrow: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 9.5, letterSpacing: 0.8 },
  tipTitle: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 2 },
  tipBody: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5, lineHeight: 17, marginTop: 3 },
});
