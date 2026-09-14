import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { MemoryLearningCard } from '@/components/MemoryLearningCard';
import { CommonHeader } from '@/components/CommonHeader';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import LoadingView from '@/components/LoadingView';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySets } from '@/features/memory-sets';
import type { CommunityMemorySetFilters, CommunityMemorySetSummary } from '@/features/memory-sets';
import { memopalThemes } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Check, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { forwardRef, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DiscoverMemorySetsScreenProps = { embedded?: boolean };

export function DiscoverMemorySetsScreen({ embedded = false }: DiscoverMemorySetsScreenProps) {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const { colorScheme } = useColorScheme();
  const activeTheme = memopalThemes[colorScheme ?? 'light'];
  const router = useRouter();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const filtersSheetRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState('');
  const [techniqueKey, setTechniqueKey] = useState<CommunityMemorySetFilters['techniqueKey']>();
  const [goalType, setGoalType] = useState<CommunityMemorySetFilters['goalType']>();
  const [sort, setSort] = useState<CommunityMemorySetFilters['sort']>('newest');
  const debouncedSearch = useDebouncedValue(search, 350);
  const query = useCommunityMemorySets({ search: debouncedSearch, techniqueKey, goalType, sort });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const activeFilterCount = Number(Boolean(techniqueKey)) + Number(Boolean(goalType)) + Number(sort !== 'newest');
  const activeFilterSummary = [
    techniqueKey === 'palace' ? t('palaces') : techniqueKey === 'number-peg' ? t('numberPeg') : undefined,
    goalType === 'facts' ? t('goalFacts') : goalType === 'spelling' ? t('goalSpelling') : goalType === 'ordered-list' ? t('goalOrderedList') : goalType === 'names' ? t('goalNames') : goalType === 'custom' ? t('goalCustom') : undefined,
    sort === 'popular' ? t('sortPopular') : undefined,
  ].filter(Boolean).join(' · ');

  const clearFilter = () => {
    setTechniqueKey(undefined);
    setGoalType(undefined);
  };

  const resetFilters = () => {
    clearFilter();
    setSort('newest');
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
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={`${t('filtersButton')}${activeFilterCount ? `, ${activeFilterCount}` : ''}`}
                onPress={() => filtersSheetRef.current?.present()}
                style={styles.filterButton}>
                <SlidersHorizontal size={18} color={theme.violetDeep} />
                {activeFilterCount ? <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View> : null}
              </AnimatedPressable>
            </View>
            {activeFilterCount ? <View style={styles.activeFiltersRow}>
              <View style={styles.activeFiltersPill}>
                <SlidersHorizontal size={13} color={theme.violetDeep} />
                <Text numberOfLines={1} style={styles.activeFiltersText}>{activeFilterSummary}</Text>
              </View>
              <AnimatedPressable accessibilityRole="button" accessibilityLabel={t('clearFilters')} onPress={resetFilters} style={styles.clearFiltersButton}>
                <X size={16} color={theme.inkSoft} />
              </AnimatedPressable>
            </View> : null}
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
        ListEmptyComponent={!isOffline && query.isLoading ? <View style={styles.loading}><LoadingView description={t('discoverLoading')} /></View> : canShowRequestErrors && query.isError ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🫧</Text><Text style={styles.emptyTitle}>{t('discoverUnavailable')}</Text><Text style={styles.emptyBody}>{t('connectionRetry')}</Text><AnimatedPressable onPress={() => void query.refetch()} style={styles.retry}><Text style={styles.retryText}>{t('retry')}</Text></AnimatedPressable></View> : !isOffline ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🌱</Text><Text style={styles.emptyTitle}>{t('discoverEmpty')}</Text><Text style={styles.emptyBody}>{t('discoverEmptyBody')}</Text></View> : null}
        ListFooterComponent={!isOffline && query.hasNextPage ? <AnimatedPressable disabled={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} style={styles.loadMore}>{query.isFetchingNextPage ? <ActivityIndicator color={theme.violetDeep} /> : <><Text style={styles.loadMoreText}>{t('loadMore')}</Text><ArrowRight size={15} color={theme.violetDeep} /></>}</AnimatedPressable> : <View style={styles.footerSpace} />}
      />
      <DiscoverFiltersSheet
        ref={filtersSheetRef}
        techniqueKey={techniqueKey}
        goalType={goalType}
        sort={sort}
        onTechniqueChange={setTechniqueKey}
        onGoalChange={setGoalType}
        onSortChange={setSort}
        onReset={resetFilters}
        onDone={() => filtersSheetRef.current?.dismiss()}
      />
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></AnimatedPressable>;
}

type DiscoverFiltersSheetProps = {
  techniqueKey?: CommunityMemorySetFilters['techniqueKey'];
  goalType?: CommunityMemorySetFilters['goalType'];
  sort: CommunityMemorySetFilters['sort'];
  onTechniqueChange: (value: CommunityMemorySetFilters['techniqueKey']) => void;
  onGoalChange: (value: CommunityMemorySetFilters['goalType']) => void;
  onSortChange: (value: CommunityMemorySetFilters['sort']) => void;
  onReset: () => void;
  onDone: () => void;
};

const DiscoverFiltersSheet = forwardRef<BottomSheetModal, DiscoverFiltersSheetProps>(
  ({ techniqueKey, goalType, sort, onTechniqueChange, onGoalChange, onSortChange, onReset, onDone }, ref) => {
    const { styles, theme } = useStyles();
    const { t } = useTranslation('library');
    const insets = useSafeAreaInsets();
    const toggleGoal = (value: NonNullable<CommunityMemorySetFilters['goalType']>) => onGoalChange(goalType === value ? undefined : value);

    return <CustomBottomSheetModal ref={ref} enableDynamicSizing backgroundStyle={styles.sheetBackground}>
      <BottomSheetScrollView contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>{t('filtersTitle')}</Text>
            <Text style={styles.sheetDescription}>{t('filtersDescription')}</Text>
          </View>
          <AnimatedPressable accessibilityRole="button" onPress={onReset} style={styles.resetButton}>
            <Text style={styles.resetText}>{t('clearFilters')}</Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.filterLabel}>{t('filterTechnique')}</Text>
        <View style={styles.sheetChips}>
          <FilterChip label={t('discoverAll')} selected={!techniqueKey} onPress={() => onTechniqueChange(undefined)} />
          <FilterChip label={t('palaces')} selected={techniqueKey === 'palace'} onPress={() => onTechniqueChange(techniqueKey === 'palace' ? undefined : 'palace')} />
          <FilterChip label={t('numberPeg')} selected={techniqueKey === 'number-peg'} onPress={() => onTechniqueChange(techniqueKey === 'number-peg' ? undefined : 'number-peg')} />
        </View>

        <Text style={styles.filterLabel}>{t('filterGoal')}</Text>
        <View style={styles.sheetChips}>
          <FilterChip label={t('goalFacts')} selected={goalType === 'facts'} onPress={() => toggleGoal('facts')} />
          <FilterChip label={t('goalSpelling')} selected={goalType === 'spelling'} onPress={() => toggleGoal('spelling')} />
          <FilterChip label={t('goalOrderedList')} selected={goalType === 'ordered-list'} onPress={() => toggleGoal('ordered-list')} />
          <FilterChip label={t('goalNames')} selected={goalType === 'names'} onPress={() => toggleGoal('names')} />
          <FilterChip label={t('goalCustom')} selected={goalType === 'custom'} onPress={() => toggleGoal('custom')} />
        </View>

        <Text style={styles.filterLabel}>{t('filterSort')}</Text>
        <View style={styles.sheetChips}>
          <FilterChip label={t('sortNewest')} selected={sort === 'newest'} onPress={() => onSortChange('newest')} />
          <FilterChip label={t('sortPopular')} selected={sort === 'popular'} onPress={() => onSortChange('popular')} />
        </View>

        <AnimatedPressable accessibilityRole="button" onPress={onDone} style={styles.doneButton}>
          <Check size={17} color={theme.onAccent} />
          <Text style={styles.doneButtonText}>{t('filtersDone')}</Text>
        </AnimatedPressable>
      </BottomSheetScrollView>
    </CustomBottomSheetModal>;
  },
);

DiscoverFiltersSheet.displayName = 'DiscoverFiltersSheet';

function CommunityMemoryCard({ item, onPress, t }: { item: CommunityMemorySetSummary; onPress: () => void; t: (key: any) => string }) {
  const { styles } = useStyles();
  const isPalace = item.techniqueKey === 'palace';
  const artwork = isPalace && item.coverImageUrl ? (
    <AppImage imageUrl={item.coverImageUrl} style={styles.coverImage} />
  ) : (
    <Text style={styles.coverEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
  );

  return (
    <View style={styles.cardContainer}>
      <MemoryLearningCard
        techniqueKey={item.techniqueKey}
        title={item.title}
        description={item.description ?? undefined}
        metadata={`${item.itemCount} ${item.itemCount === 1 ? t('item') : t('items')} · ${item.author.displayName}`}
        secondaryMetadata={`${item.copyCount} ${t('copies')} · ${goalLabel(item.goalType, t)}`}
        artwork={artwork}
        accessibilityLabel={`${item.title}, ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}, ${item.itemCount} ${t('items')}, ${item.author.displayName}, ${item.copyCount} ${t('copies')}`}
        onPress={onPress}
      />
    </View>
  );
}

function goalLabel(goal: string, t: (key: any) => string) {
  const key = `goal${goal.replace(/(^|-)(.)/g, (_, __, letter) => letter.toUpperCase())}`;
  return t(key);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 30 },
  searchBox: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', minHeight: 54, paddingLeft: 14, paddingRight: 5 },
  searchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, marginHorizontal: 10, minHeight: 46 },
  filterButton: { alignItems: 'center', borderRadius: 13, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  filterCount: { alignItems: 'center', backgroundColor: theme.berry, borderColor: theme.paper, borderRadius: 8, borderWidth: 1.5, height: 16, justifyContent: 'center', minWidth: 16, paddingHorizontal: 3, position: 'absolute', right: 1, top: 1 },
  filterCountText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 8, lineHeight: 10 },
  activeFiltersRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  activeFiltersPill: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, flex: 1, flexDirection: 'row', gap: 6, minHeight: 32, paddingHorizontal: 10 },
  activeFiltersText: { color: theme.violetDeep, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  clearFiltersButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  filterLabel: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: .55, marginTop: 14, textTransform: 'uppercase' },
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 14 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sheetTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 },
  sheetDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, marginTop: 3 },
  resetButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  resetText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.5, justifyContent: 'center', minHeight: 40, paddingHorizontal: 13 },
  chipSelected: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep },
  chipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  chipTextSelected: { color: theme.onAccent},
  doneButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.violetDeep, borderRadius: 15, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 22, minHeight: 48 },
  doneButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginTop: 19 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 19 },
  resultCount: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  cardRow: { justifyContent: 'space-between' },
  cardContainer: { width: '48.5%' },
  coverImage: { height: '100%', width: '100%' },
  coverEmoji: { fontSize: 29 },
  separator: { height: 9 }, loading: { height: 200, overflow: 'hidden' }, empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 64 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, marginTop: 11, textAlign: 'center' }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' }, retry: { backgroundColor: theme.sun, borderRadius: 13, marginTop: 15, paddingHorizontal: 18, paddingVertical: 11 }, retryText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 13 }, loadMore: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.violetTint, borderRadius: 14, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 17, minHeight: 44, paddingHorizontal: 17 }, loadMoreText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }, footerSpace: { height: 10 },
}));
