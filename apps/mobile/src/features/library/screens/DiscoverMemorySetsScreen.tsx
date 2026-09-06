import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySets } from '@/features/memory-sets';
import type { CommunityMemorySetFilters, CommunityMemorySetSummary } from '@/features/memory-sets';
import { memopalTheme as theme, memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';

type DiscoverMemorySetsScreenProps = { embedded?: boolean };

export function DiscoverMemorySetsScreen({ embedded = false }: DiscoverMemorySetsScreenProps) {
  const { t } = useTranslation('library');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [techniqueKey, setTechniqueKey] = useState<CommunityMemorySetFilters['techniqueKey']>();
  const [goalType, setGoalType] = useState<CommunityMemorySetFilters['goalType']>();
  const [sort, setSort] = useState<CommunityMemorySetFilters['sort']>('newest');
  const debouncedSearch = useDebouncedValue(search, 350);
  const query = useCommunityMemorySets({ search: debouncedSearch, techniqueKey, goalType, sort });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const clearFilter = () => {
    setTechniqueKey(undefined);
    setGoalType(undefined);
  };

  return (
    <View style={styles.page}>
      {!embedded ? <CommonHeader eyebrow={t('discoverEyebrow')} title={t('discoverTitle')} description={t('discoverDescription')} backAction={() => router.back()} /> : null}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        ListHeaderComponent={
          <View>
            <View style={styles.searchBox}>
              <Search size={19} color={theme.inkSoft} />
              <TextInput
                accessibilityLabel={t('discoverSearch')}
                value={search}
                onChangeText={setSearch}
                placeholder={t('discoverSearchPlaceholder')}
                placeholderTextColor={theme.inkSoft}
                style={styles.searchInput}
                returnKeyType="search"
              />
              <SlidersHorizontal size={18} color={theme.violetDeep} />
            </View>
            <Text style={styles.filterLabel}>{t('filterTechnique')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              <FilterChip label={t('discoverAll')} selected={!techniqueKey && !goalType} onPress={clearFilter} />
              <FilterChip label={t('palaces')} selected={techniqueKey === 'palace'} onPress={() => setTechniqueKey(techniqueKey === 'palace' ? undefined : 'palace')} />
              <FilterChip label={t('numberPeg')} selected={techniqueKey === 'number-peg'} onPress={() => setTechniqueKey(techniqueKey === 'number-peg' ? undefined : 'number-peg')} />
            </ScrollView>
            <Text style={styles.filterLabel}>{t('filterGoal')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
              <FilterChip label={t('goalFacts')} selected={goalType === 'facts'} onPress={() => setGoalType(goalType === 'facts' ? undefined : 'facts')} />
              <FilterChip label={t('goalSpelling')} selected={goalType === 'spelling'} onPress={() => setGoalType(goalType === 'spelling' ? undefined : 'spelling')} />
              <FilterChip label={t('goalOrderedList')} selected={goalType === 'ordered-list'} onPress={() => setGoalType(goalType === 'ordered-list' ? undefined : 'ordered-list')} />
              <FilterChip label={t('goalNames')} selected={goalType === 'names'} onPress={() => setGoalType(goalType === 'names' ? undefined : 'names')} />
              <FilterChip label={t('goalCustom')} selected={goalType === 'custom'} onPress={() => setGoalType(goalType === 'custom' ? undefined : 'custom')} />
            </ScrollView>
            <View style={styles.sortRow}>
              <Text style={styles.filterLabel}>{t('filterSort')}</Text>
              <FilterChip label={sort === 'newest' ? t('sortNewest') : t('sortPopular')} selected onPress={() => setSort(sort === 'newest' ? 'popular' : 'newest')} />
            </View>
            <View style={styles.headingRow}>
              <Text style={[styles.sectionTitle, { color: activeTheme.ink }]}>{t('discoverCommunity')}</Text>
              <Text style={styles.resultCount}>{query.data?.pages[0]?.totalCount ?? items.length}</Text>
            </View>
          </View>
        }
        numColumns={2}
        columnWrapperStyle={styles.cardRow}
        renderItem={({ item }) => <CommunityMemoryCard item={item} onPress={() => router.push(`/community/memory-sets/${item.id}` as Href)} t={t} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={query.isLoading ? <View style={styles.loading}><LoadingView description={t('discoverLoading')} /></View> : query.isError ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🫧</Text><Text style={styles.emptyTitle}>{t('discoverUnavailable')}</Text><Text style={styles.emptyBody}>{t('connectionRetry')}</Text><AnimatedPressable onPress={() => void query.refetch()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></AnimatedPressable></View> : <View style={styles.empty}><Text style={styles.emptyEmoji}>🌱</Text><Text style={styles.emptyTitle}>{t('discoverEmpty')}</Text><Text style={styles.emptyBody}>{t('discoverEmptyBody')}</Text></View>}
        ListFooterComponent={query.hasNextPage ? <AnimatedPressable disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} style={styles.loadMore}>{query.isFetchingNextPage ? <ActivityIndicator color={theme.violetDeep} /> : <><Text style={styles.loadMoreText}>{t('loadMore')}</Text><ArrowRight size={15} color={theme.violetDeep} /></>}</AnimatedPressable> : <View style={styles.footerSpace} />}
      />
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <AnimatedPressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></AnimatedPressable>;
}

function CommunityMemoryCard({ item, onPress, t }: { item: CommunityMemorySetSummary; onPress: () => void; t: (key: any) => string }) {
  const isPalace = item.techniqueKey === 'palace';
  return <AnimatedPressable containerStyle={styles.cardContainer} onPress={onPress} style={styles.card}>
    <View style={[styles.cover, isPalace ? styles.palaceCover : styles.pegCover]}>
      {isPalace && item.coverImageUrl ? <AppImage imageUrl={item.coverImageUrl} style={styles.coverImage} /> : <>
        <View style={styles.posterOrbLarge} /><View style={styles.posterOrbSmall} />
        <Text style={styles.coverEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
        {!isPalace ? <Text style={styles.posterWord}>{item.title.slice(0, 18)}</Text> : null}
      </>}
      <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>{t('publicBadge')}</Text></View>
    </View>
    <View style={styles.cardBody}>
      <Text style={[styles.cardLabel, isPalace ? styles.palaceLabel : styles.pegLabel]}>{isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}</Text>
      <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.cardMeta}>{item.itemCount} {item.itemCount === 1 ? t('item') : t('items')} · {item.author.displayName}</Text>
      <Text numberOfLines={1} style={styles.cardStats}>↗ {item.copyCount} {t('copies')} · {goalLabel(item.goalType, t)}</Text>
    </View>
  </AnimatedPressable>;
}

function goalLabel(goal: string, t: (key: any) => string) {
  const key = `goal${goal.replace(/(^|-)(.)/g, (_, __, letter) => letter.toUpperCase())}`;
  return t(key);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 30 },
  searchBox: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', minHeight: 50, paddingHorizontal: 14 },
  searchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, marginHorizontal: 10, minHeight: 46 },
  filterLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: .55, marginTop: 14, textTransform: 'uppercase' },
  horizontalChips: { gap: 8, paddingVertical: 7 },
  sortRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  chip: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.5, minHeight: 36, justifyContent: 'center', paddingHorizontal: 12 },
  chipSelected: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  chipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  chipTextSelected: { color: 'white' },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginTop: 25 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  resultCount: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  cardRow: { justifyContent: 'space-between' },
  cardContainer: { width: '48.5%' },
  card: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 18, borderWidth: 1.5, marginBottom: 12, overflow: 'hidden', width: '100%' },
  cover: { alignItems: 'center', height: 112, justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  palaceCover: { backgroundColor: theme.violetTint }, pegCover: { backgroundColor: theme.berryTint },
  coverImage: { height: '100%', width: '100%' },
  posterOrbLarge: { backgroundColor: 'rgba(255,111,145,0.16)', borderRadius: 70, height: 140, position: 'absolute', right: -30, top: -45, width: 140 },
  posterOrbSmall: { backgroundColor: 'rgba(155,140,255,0.17)', borderRadius: 38, bottom: -22, height: 76, left: -15, position: 'absolute', width: 76 },
  coverEmoji: { fontSize: 38 },
  posterWord: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 10, marginTop: 5, maxWidth: '78%' },
  coverBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, left: 8, paddingHorizontal: 6, paddingVertical: 4, position: 'absolute', top: 8 },
  coverBadgeText: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 7.5 },
  cardBody: { minHeight: 107, padding: 10 },
  cardLabel: { fontFamily: typography.bodyExtraBold, fontSize: 8.5, letterSpacing: .7 }, palaceLabel: { color: theme.violetDeep }, pegLabel: { color: theme.berryDeep },
  cardTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 15, lineHeight: 19, marginTop: 4 },
  cardMeta: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 9.5, marginTop: 7 }, cardStats: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8.5, marginTop: 4 },
  separator: { height: 9 }, loading: { height: 200, overflow: 'hidden' }, empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 64 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, marginTop: 11, textAlign: 'center' }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' }, retry: { backgroundColor: theme.sun, borderRadius: 13, marginTop: 15, paddingHorizontal: 18, paddingVertical: 11 }, retryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 }, loadMore: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.violetTint, borderRadius: 14, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 17, minHeight: 44, paddingHorizontal: 17 }, loadMoreText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }, footerSpace: { height: 10 },
});
