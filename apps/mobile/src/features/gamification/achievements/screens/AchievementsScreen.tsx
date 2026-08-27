import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useAllBadges } from '@/features/gamification/shared/hooks/useBadges';
import { useLevelByXp } from '@/features/gamification/shared/hooks/useLevelConfigs';
import { useXpEvents } from '@/features/gamification/shared/hooks/useXpEvents';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { usePalaceScenes } from '@/features/palace-scenes/hooks/usePalaceScenes';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import type { Badge } from '@/features/gamification/shared/types/levelAndbadge';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, History } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BadgeDetailsModal } from '../components/BadgeDetailsModal';
import { LevelProgressHeader } from '../components/LevelProgressHeader';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
type BadgeWithEarned = Badge & { isEarned: boolean };

export default function AchievementsScreen() {
  const router = useRouter();
  const { user, isLoading: userLoading, refetch: refetchUser } = useCurrentUser();
  const { badges, isLoading: badgesLoading, refetch: refetchBadges } = useAllBadges();
  const totalXp = Math.max(0, user?.totalXp ?? 0);
  const { levelInfo, isLoading: levelLoading, refetch: refetchLevel } = useLevelByXp(totalXp, user?.level);
  const { events, refetch: refetchEvents } = useXpEvents({ recentDays: 7 });
  const palaceScenes = usePalaceScenes();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithEarned | null>(null);

  const displayLevel = useMemo(() => {
    const currentLevel = Math.max(1, levelInfo?.currentLevel ?? user?.level ?? 1);
    return {
      currentLevel,
      xpInCurrentLevel: Math.max(0, levelInfo?.xpInCurrentLevel ?? totalXp),
      xpToNextLevel: Math.max(0, levelInfo?.xpToNextLevel ?? 0),
      totalXp,
      title: levelInfo?.currentLevelConfig?.title ?? 'Memory Apprentice',
    };
  }, [levelInfo, totalXp, user?.level]);

  const activity = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));
      return date;
    });
    const values = days.map((day) => events
      .filter((event) => {
        const eventDate = new Date(event.createdAt);
        return eventDate.getFullYear() === day.getFullYear()
          && eventDate.getMonth() === day.getMonth()
          && eventDate.getDate() === day.getDate();
      })
      .reduce((sum, event) => sum + Math.max(0, event.xpAmount), 0));
    const max = Math.max(1, ...values);
    return values.map((value, index) => ({ label: DAY_LABELS[index], percent: value ? Math.max(10, Math.round((value / max) * 100)) : 6, today: index === 6 }));
  }, [events]);

  const unlockedPegs = getUnlockedPegCount(displayLevel.currentLevel);
  const palaceTotal = palaceScenes.data?.length ?? 0;
  const palaceUnlocked = palaceScenes.data?.filter((scene) => !scene.isPremium || Boolean(user?.isPremium)).length ?? 0;
  const orderedBadges = useMemo(() => [...badges].map((badge) => ({ ...badge, isEarned: Boolean(badge.earnedAt) })).sort((left, right) => {
    if (Boolean(left.earnedAt) !== Boolean(right.earnedAt)) return left.earnedAt ? -1 : 1;
    return left.name.localeCompare(right.name);
  }).slice(0, 8), [badges]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchUser(),
        refetchBadges(),
        refetchLevel(),
        refetchEvents(),
        palaceScenes.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [palaceScenes, refetchBadges, refetchEvents, refetchLevel, refetchUser]);

  if (userLoading || badgesLoading || levelLoading) return <LoadingView description="Loading your progress…" />;

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Progress"
        title="Your growth"
        description="Levels, streaks, and badges"
        hideBackButton
        actions={[{ icon: History, onPress: () => router.push('/rewards-history'), accessibilityLabel: 'Open rewards history' }]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <LevelProgressHeader level={displayLevel} streak={user?.stats?.currentStreak ?? 0} />

        <View style={styles.statRow}>
          <StatTile value={`${user?.stats?.lessonsCompleted ?? 0}`} label="Sessions done" />
          <StatTile value={`${user?.stats?.wordsLearned ?? 0}`} label="Words learned" />
          <StatTile value={`${user?.stats?.longestStreak ?? 0}`} label="Best streak" />
        </View>

        <Text style={styles.sectionLabel}>This week&apos;s activity</Text>
        <View style={styles.barChart}>
          {activity.map((day, index) => (
            <View key={`${day.label}-${index}`} style={styles.barColumn}>
              <LinearGradient
                colors={day.today ? ['#FFC93C', '#F2A900'] : ['#4FC0E8', '#3A9DC4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.bar, { height: `${day.percent}%` }]}
              />
              <Text style={styles.barLabel}>{day.label}</Text>
            </View>
          ))}
        </View>

        <ProgressLine
          label="Peg progress"
          value={`${unlockedPegs} / 100 pegs unlocked`}
          percent={(unlockedPegs / 100) * 100}
          color="#FF6F91"
          onPress={() => router.push('/number-peg/map')}
        />
        <ProgressLine
          label="Palace progress"
          value={`${palaceUnlocked} / ${Math.max(1, palaceTotal)} palaces unlocked`}
          percent={palaceTotal ? (palaceUnlocked / palaceTotal) * 100 : 0}
          color="#9B8CFF"
          onPress={() => router.push('/palaces/map')}
        />

        <Text style={styles.sectionLabel}>Badges</Text>
        <View style={styles.badgeGrid}>
          {orderedBadges.map((badge) => {
            const earned = Boolean(badge.earnedAt);
            return (
              <AnimatedPressable
                key={badge.id}
                accessibilityLabel={`${earned ? 'Earned' : 'Locked'} badge: ${badge.name}`}
                onPress={() => setSelectedBadge(badge)}
                style={[styles.badgeTile, earned && styles.earnedBadge]}>
                {earned ? <LinearGradient colors={['#FFF7E0', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.badgeGradient} /> : null}
                <Text style={[styles.badgeEmoji, !earned && styles.lockedEmoji]}>{badgeEmoji(badge)}</Text>
                <Text numberOfLines={2} style={[styles.badgeText, earned && styles.earnedBadgeText]}>{badge.name}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
        {orderedBadges.length === 0 ? <Text style={styles.emptyText}>Keep practising to earn your first badge.</Text> : null}
      </ScrollView>

      <BadgeDetailsModal badge={selectedBadge} visible={Boolean(selectedBadge)} onClose={() => setSelectedBadge(null)} />
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return <View style={styles.statTile}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function ProgressLine({ label, value, percent, color, onPress }: { label: string; value: string; percent: number; color: string; onPress: () => void }) {
  return (
    <View style={styles.progressLine}>
      <View style={styles.progressLineHeader}>
        <Text style={styles.progressSectionLabel}>{label}</Text>
        <AnimatedPressable accessibilityLabel={`See all ${label}`} onPress={onPress} style={styles.seeAll}>
          <View style={styles.seeAllRow}><Text style={styles.seeAllText}>See all</Text><ArrowRight size={12} color="#4FC0E8" /></View>
        </AnimatedPressable>
      </View>
      <Text style={styles.progressLabel}>{value}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }]} /></View>
    </View>
  );
}

function badgeEmoji(badge: Badge) {
  const source = `${badge.key} ${badge.name} ${badge.icon ?? ''}`.toLowerCase();
  if (source.includes('streak') || source.includes('fire')) return '🔥';
  if (source.includes('peg')) return '🕯️';
  if (source.includes('palace')) return '🏰';
  if (source.includes('word')) return '📚';
  if (source.includes('level')) return '🏆';
  if (source.includes('speed')) return '⚡';
  if (source.includes('night')) return '🌙';
  if (source.includes('perfect') || source.includes('recall')) return '🎯';
  return '🏅';
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 128 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 0 },
  statTile: { flex: 1, alignItems: 'center', backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 6 },
  statValue: { color: '#2B2A3D', fontFamily: typography.displayExtraBold, fontSize: 19 },
  statLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 10, textAlign: 'center', marginTop: 2 },
  sectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },
  barChart: { height: 100, flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 9.5 },
  progressLine: { marginTop: 20 },
  progressLineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  progressSectionLabel: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  progressLabel: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 11.5 },
  seeAll: { minHeight: 32, justifyContent: 'center' },
  seeAllRow: { flexDirection: 'row' as const, alignItems: 'center', gap: 2 },
  seeAllText: { color: '#4FC0E8', fontFamily: typography.displayExtraBold, fontSize: 11.5 },
  progressTrack: { height: 9, backgroundColor: '#EEE9DC', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeTile: { width: '22.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#EEE9DC', borderRadius: 16, padding: 4, position: 'relative' },
  earnedBadge: { borderColor: '#F2A900' },
  badgeGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 14 },
  badgeEmoji: { fontSize: 22 },
  lockedEmoji: { opacity: 0.4 },
  badgeText: { color: '#6B6A80', fontFamily: typography.displayExtraBold, fontSize: 8.5, textAlign: 'center' },
  earnedBadgeText: { color: '#2B2A3D' },
  emptyText: { color: '#6B6A80', fontFamily: typography.bodyBold, fontSize: 12, paddingVertical: 18, textAlign: 'center' },
});
