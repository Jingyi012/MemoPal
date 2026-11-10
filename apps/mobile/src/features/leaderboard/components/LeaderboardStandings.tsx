import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Star, Trophy, Users } from '@/core/icons';
import type { LeaderboardEntry } from '../types/leaderboard.types';
import type { LeaderboardPodiumSlot } from '../utils/leaderboardPodium';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';

const PODIUM_ARTWORK = {
  1: require('../../../../assets/images/leaderboard/podium-mascot-gold.webp'),
  2: require('../../../../assets/images/leaderboard/podium-mascot-silver.webp'),
  3: require('../../../../assets/images/leaderboard/podium-mascot-bronze.webp'),
} as const;

const PODIUM_LAYOUT = {
  1: { height: 112, colors: ['#FFF0A4', '#F2B83C'] },
  2: { height: 96, colors: ['#F1F4FA', '#C5D0E1'] },
  3: { height: 90, colors: ['#FFD9B9', '#D98754'] },
} as const;

type Props = Readonly<{
  title: string;
  participantCount: number;
  slots: readonly LeaderboardPodiumSlot[];
  youLabel: string;
  scoreUnit: string;
  openSlotLabel: string;
}>;

/** Shared podium + standings heading. Board-specific pages supply only their labels and ranked entries. */
export function LeaderboardStandings({ title, participantCount, slots, youLabel, scoreUnit, openSlotLabel }: Props) {
  const { styles } = useStyles();

  return <>
    <View style={styles.heading}>
      <View style={styles.titleLine}>
        <View style={styles.headingIcon}><Trophy size={16} color="#B77A00" /></View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.participantCount}>
        <Users size={14} color="#6540B3" />
        <Text style={styles.participantCountText}>{participantCount}</Text>
      </View>
    </View>
    <LinearGradient
      colors={['#F5F0FF', '#EEF5FF', '#FFF6E8']}
      locations={[0, 0.58, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.stage}>
      <View pointerEvents="none" style={styles.stageGlow} />
      <View pointerEvents="none" style={styles.sparkleLeft}><Sparkles size={19} color="#A891E8" /></View>
      <View pointerEvents="none" style={styles.sparkleRight}><Star size={15} color="#F2B644" /></View>
      <View pointerEvents="none" style={styles.stageFloor} />
      <View style={styles.podium}>
        {slots.map(({ rank, entry }) => {
          const layout = PODIUM_LAYOUT[rank];
          const displayName = entry?.isCurrentUser ? youLabel : entry?.alias;
          return <View key={rank} style={styles.slot}>
            <Image
              accessible={false}
              resizeMode="contain"
              source={PODIUM_ARTWORK[rank]}
              style={[
                styles.mascot,
                rank === 1 ? styles.mascotChampion : styles.mascotSide,
                !entry && styles.mascotPlaceholder,
                { bottom: layout.height - 4 },
              ]}
            />
            <LinearGradient
              colors={layout.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.pedestal,
                rank === 1 ? styles.pedestalFirst : rank === 2 ? styles.pedestalSecond : styles.pedestalThird,
                { height: layout.height },
                !entry && styles.pedestalPlaceholder,
              ]}>
              <View style={[styles.pedestalCap, rank === 1 ? styles.pedestalCapFirst : rank === 2 ? styles.pedestalCapSecond : styles.pedestalCapThird]} />
              <View style={[styles.pedestalRank, rank === 1 ? styles.pedestalRankFirst : rank === 2 ? styles.pedestalRankSecond : styles.pedestalRankThird]}>
                <Text style={[styles.pedestalRankText, rank === 1 ? styles.pedestalRankTextFirst : rank === 2 ? styles.pedestalRankTextSecond : styles.pedestalRankTextThird]}>{rank}</Text>
              </View>
              <Text numberOfLines={1} style={[styles.pedestalName, rank === 1 ? styles.pedestalNameFirst : rank === 2 ? styles.pedestalNameSecond : styles.pedestalNameThird, entry?.isCurrentUser && styles.pedestalCurrentName]}>
                {entry ? displayName : openSlotLabel}
              </Text>
              <Text style={[styles.pedestalScore, rank === 1 ? styles.pedestalScoreFirst : rank === 2 ? styles.pedestalScoreSecond : styles.pedestalScoreThird]}>
                {entry ? entry.score : '—'}{entry ? <Text style={styles.pedestalScoreUnit}> {scoreUnit}</Text> : null}
              </Text>
            </LinearGradient>
          </View>;
        })}
      </View>
    </LinearGradient>
  </>;
}

/** A compact row for standings below the podium; reusable for any metric/board. */
export function LeaderboardEntryRow({ entry, youLabel, scoreUnit }: Readonly<{
  entry: LeaderboardEntry;
  youLabel: string;
  scoreUnit: string;
}>) {
  const { styles } = useStyles();
  const placeStyle = entry.rank === 1 ? styles.rowFirst : entry.rank === 2 ? styles.rowSecond : entry.rank === 3 ? styles.rowThird : null;
  const badgeStyle = entry.rank === 1 ? styles.rowBadgeFirst : entry.rank === 2 ? styles.rowBadgeSecond : entry.rank === 3 ? styles.rowBadgeThird : styles.rowBadgeDefault;
  const badgeTextStyle = entry.rank === 1 ? styles.rowBadgeTextFirst : entry.rank === 2 ? styles.rowBadgeTextSecond : entry.rank === 3 ? styles.rowBadgeTextThird : styles.rowBadgeTextDefault;
  const name = entry.isCurrentUser ? youLabel : entry.alias;

  return <View style={[styles.row, placeStyle, entry.isCurrentUser && styles.currentRow]}>
    <View style={[styles.rowBadge, badgeStyle]}><Text style={[styles.rowBadgeText, badgeTextStyle]}>#{entry.rank}</Text></View>
    <View style={[styles.rowAvatar, entry.isCurrentUser && styles.rowAvatarCurrent]}>
      <Text style={[styles.rowAvatarText, entry.isCurrentUser && styles.rowAvatarTextCurrent]}>{firstGlyph(name)}</Text>
    </View>
    <Text numberOfLines={1} style={styles.rowName}>{name}</Text>
    <Text style={styles.rowScore}>{entry.score}<Text style={styles.rowScoreUnit}> {scoreUnit}</Text></Text>
  </View>;
}

function firstGlyph(value: string) {
  return Array.from(value.trim())[0] ?? '✦';
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  heading: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 2 },
  titleLine: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 8 },
  headingIcon: { alignItems: 'center', backgroundColor: '#FFF3C4', borderColor: '#F0D26B', borderRadius: 12, borderWidth: 1, height: 34, justifyContent: 'center', width: 34 },
  title: { color: theme.ink, flex: 1, fontFamily: typography.displayExtraBold, fontSize: 15, lineHeight: 20 },
  participantCount: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, flexDirection: 'row', gap: 5, minHeight: 29, paddingHorizontal: 9 },
  participantCountText: { color: theme.violetDeep, fontFamily: typography.displayExtraBold, fontSize: 16 },
  stage: { borderColor: '#E5D8FF', borderRadius: 24, borderWidth: 1, height: 228, overflow: 'hidden', paddingHorizontal: 9, paddingTop: 12, paddingBottom: 8, position: 'relative' },
  stageGlow: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 999, height: 150, left: '18%', position: 'absolute', top: -82, width: 230 },
  sparkleLeft: { left: 17, opacity: 0.85, position: 'absolute', top: 64 },
  sparkleRight: { opacity: 0.9, position: 'absolute', right: 24, top: 29 },
  stageFloor: { backgroundColor: 'rgba(175,151,227,0.28)', borderRadius: 999, bottom: 8, height: 14, left: 17, position: 'absolute', right: 17 },
  podium: { alignItems: 'flex-end', flexDirection: 'row', gap: 5, height: 202, justifyContent: 'center' },
  slot: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', position: 'relative' },
  mascot: { alignSelf: 'center', position: 'absolute', zIndex: 3 },
  mascotChampion: { height: 98, width: 86 },
  mascotSide: { height: 82, width: 72 },
  mascotPlaceholder: { opacity: 0.3 },
  pedestal: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.8)', borderRadius: 15, borderWidth: 1.5, justifyContent: 'flex-start', overflow: 'hidden', paddingHorizontal: 4, paddingTop: 11, paddingBottom: 7, width: '100%', zIndex: 1 },
  pedestalFirst: { borderColor: '#FFE48A', shadowColor: '#C38B22', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  pedestalSecond: { borderColor: '#E1E7F0' },
  pedestalThird: { borderColor: '#F7C59E' },
  pedestalPlaceholder: { opacity: 0.66 },
  pedestalCap: { alignSelf: 'stretch', borderTopLeftRadius: 12, borderTopRightRadius: 12, height: 7, position: 'absolute', top: 0 },
  pedestalCapFirst: { backgroundColor: '#FFE58A' },
  pedestalCapSecond: { backgroundColor: '#EEF2F8' },
  pedestalCapThird: { backgroundColor: '#FFD6B3' },
  pedestalRank: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.9)', borderRadius: 999, borderWidth: 1, height: 21, justifyContent: 'center', width: 28 },
  pedestalRankFirst: { backgroundColor: '#FFF6CC' },
  pedestalRankSecond: { backgroundColor: '#FFFFFF' },
  pedestalRankThird: { backgroundColor: '#FFF1E5' },
  pedestalRankText: { fontFamily: typography.displayExtraBold, fontSize: 11 },
  pedestalRankTextFirst: { color: '#795000' },
  pedestalRankTextSecond: { color: '#566276' },
  pedestalRankTextThird: { color: '#854B28' },
  pedestalName: { fontFamily: typography.bodyExtraBold, fontSize: 10, marginTop: 4, maxWidth: '100%' },
  pedestalNameFirst: { color: '#684400' },
  pedestalNameSecond: { color: '#4C5869' },
  pedestalNameThird: { color: '#713B1E' },
  pedestalCurrentName: { textDecorationLine: 'underline', textDecorationColor: 'rgba(101,64,179,0.58)' },
  pedestalScore: { fontFamily: typography.displayExtraBold, fontSize: 14, lineHeight: 18, marginTop: 1 },
  pedestalScoreFirst: { color: '#684400' },
  pedestalScoreSecond: { color: '#4C5869' },
  pedestalScoreThird: { color: '#713B1E' },
  pedestalScoreUnit: { fontFamily: typography.bodySemibold, fontSize: 9 },
  row: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 6, minHeight: 52, paddingHorizontal: 10 },
  rowFirst: { backgroundColor: '#FFF8DE', borderColor: '#F0D36C' },
  rowSecond: { backgroundColor: '#F6F7FA', borderColor: '#DDE2EA' },
  rowThird: { backgroundColor: '#FFF4EB', borderColor: '#EBCDB5' },
  currentRow: { borderColor: theme.violetDeep, borderWidth: 1.5 },
  rowBadge: { alignItems: 'center', borderRadius: 10, height: 32, justifyContent: 'center', minWidth: 38, paddingHorizontal: 5 },
  rowBadgeFirst: { backgroundColor: '#FFD443' },
  rowBadgeSecond: { backgroundColor: '#D6DDE7' },
  rowBadgeThird: { backgroundColor: '#D99363' },
  rowBadgeDefault: { backgroundColor: theme.canvas },
  rowBadgeText: { fontFamily: typography.bodyExtraBold, fontSize: 11 },
  rowBadgeTextFirst: { color: '#684400' },
  rowBadgeTextSecond: { color: '#4C5869' },
  rowBadgeTextThird: { color: '#713B1E' },
  rowBadgeTextDefault: { color: theme.inkSoft },
  rowAvatar: { alignItems: 'center', backgroundColor: theme.peachTint, borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  rowAvatarCurrent: { backgroundColor: theme.violetDeep },
  rowAvatarText: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 14 },
  rowAvatarTextCurrent: { color: theme.onAccent },
  rowName: { color: theme.ink, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  rowScore: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  rowScoreUnit: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10 },
}));
