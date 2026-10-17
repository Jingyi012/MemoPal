import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { MemorySetRow } from '@/components/MemorySetRow';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { NumberPegStoryHero } from '@/features/number-peg/components/NumberPegStoryHero';
import { useMemorySets } from '@/features/memory-sets';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { NumberPegItemCard } from '@/features/number-peg/components/NumberPegItemCard';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { useNumberPegOverview } from '@/features/number-peg/hooks/useNumberPegOverview';
import { getUnlockedPegCount } from '@/features/number-peg/utils/numberPegMap';
import { getNumberPegErrorMessage } from '@/features/number-peg/utils/numberPegErrors';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, ChevronRight } from '@/core/icons';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export default function NumberPegHomeScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { t } = useTranslation('numberPeg');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const { items } = useNumberPegOverview();
  const { user } = useCurrentUser();
  const memorySets = useMemorySets('number-peg');
  const currentLevel = Math.max(1, user?.level ?? 1);
  const unlockedCount = getUnlockedPegCount(currentLevel);
  // The home rail is a preview, not the full library. Keep it scannable on
  // small screens and let the map handle the long 1–100 list.
  const visibleItems = items.slice(0, Math.min(10, unlockedCount));
  const lockedPreview = items.slice(unlockedCount, unlockedCount + 2);

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        backAction={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={memorySets.isRefetching} onRefresh={memorySets.refetch} />
        }>
        <NumberPegStoryHero onStart={() => router.push('/number-peg/create' as Href)} />

        <AnimatedPressable onPress={() => router.push('/number-peg/familiarity' as Href)} style={styles.familiarityCard}>
          <View style={styles.familiarityGlow} />
          <View style={styles.familiarityIcon}><Text style={styles.familiarityEmoji}>🧠</Text></View>
          <View style={styles.familiarityCopy}>
            <View style={styles.familiarityMeta}><Text style={styles.familiarityKicker}>{t('familiarityKicker')}</Text><Text style={styles.familiarityBadge}>1–100</Text></View>
            <Text style={styles.familiarityTitle}>{t('familiarityTitle')}</Text>
            <Text style={styles.familiarityBody}>{t('familiarityBody')}</Text>
          </View>
          <View style={styles.familiarityArrow}><ArrowRight size={17} color={theme.violetDeep} /></View>
        </AnimatedPressable>

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionEyebrow}>{t('pegSet')}</Text>
            <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('unlockedAnchors')}</Text>
          </View>
          <AnimatedPressable
            accessibilityRole="button"
            accessibilityLabel={t('seeAllPegs')}
            onPress={() => router.push('/number-peg/map' as Href)}
            style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            <ChevronRight size={15} color={theme.berryDeep} />
          </AnimatedPressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pegRail}>
          {visibleItems.map((item) => (
            <NumberPegItemCard key={item.id} item={item} compact />
          ))}
          {lockedPreview.map((item) => (
            <NumberPegItemCard key={item.id} item={item} compact locked />
          ))}
        </ScrollView>
        <Text style={styles.unlockHint}>
          {t('unlockHint').replace('{level}', String(currentLevel)).replace('{count}', String(unlockedCount))}
        </Text>

        <View style={styles.sectionHeadingRow}>
          <View style={styles.sectionHeadingCopy}>
            <Text style={styles.sectionEyebrow}>{t('memoriesSection')}</Text>
            <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('quickRecall')}</Text>
          </View>
        </View>

        {!isOffline && memorySets.isLoading ? (
          <View style={styles.loadingFrame}>
            <LoadingView description={t('loading')} />
          </View>
        ) : canShowRequestErrors && memorySets.isError ? (
          <ModuleNoticeCard
            title={t('unavailable')}
            body={getNumberPegErrorMessage(memorySets.error, t('connection'))}
            onAction={() => memorySets.refetch()}
          />
        ) : memorySets.data?.length ? (
          memorySets.data.map((memorySet) => (
            <MemorySetRow
              key={memorySet.id}
              tone="peg"
              title={memorySet.title}
              badgeText={String(memorySet.items.length)}
              subtitle={`${memorySet.items.length} ${memorySet.items.length === 1 ? t('item') : t('items')} · ${memorySet.status === 'draft' ? t('keepBuilding') : t('readyToRecall')}`}
              onPress={() => router.push(`/number-peg/${memorySet.id}` as Href)}
            />
          ))
        ) : (
          <ModuleNoticeCard
            emoji="🎒"
            title={t('empty')}
            body={t('emptyBody')}
            actionLabel={t('makeMemory')}
            actionIcon={<ArrowRight size={16} color={theme.onSun} />}
            onAction={() => router.push('/number-peg/create' as Href)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 44 },
  heroEmoji: { fontSize: 27 },
  familiarityCard: { minHeight: 82, borderRadius: 20, borderWidth: 1.5, borderColor: theme.violetLine, backgroundColor: theme.violetTint, padding: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', shadowColor: theme.ink, shadowOpacity: 0.06, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  familiarityGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 55, right: -36, top: -48, backgroundColor: theme.paper, opacity: 0.55 },
  familiarityIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center', shadowColor: theme.ink, shadowOpacity: 0.07, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  familiarityEmoji: { fontSize: 21 },
  familiarityCopy: { flex: 1 },
  familiarityMeta: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 2 },
  familiarityKicker: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8, letterSpacing: 1 },
  familiarityBadge: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9, backgroundColor: theme.paper, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  familiarityTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14 },
  familiarityBody: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  familiarityArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper },
  sectionHeadingRow: {
    marginTop: 24,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 1.1 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19, marginTop: 3 },
  sectionHeadingCopy: { flex: 1, paddingRight: 10 },
  seeAllButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 1, borderRadius: 999, backgroundColor: theme.violetTint, borderWidth: 1, borderColor: theme.violetLine, paddingLeft: 11, paddingRight: 7 },
  seeAllText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  pegRail: { marginHorizontal: -16, paddingLeft: 16 },
  unlockHint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, lineHeight: 14, marginTop: 6 },
  loadingFrame: { height: 150, overflow: 'hidden', borderRadius: 20 },
}));
