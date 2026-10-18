import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import LoadingView from '@/components/LoadingView';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySets, useSetCommunityMemorySetBookmark } from '@/features/memory-sets';
import type { CommunityMemorySetFilters, CommunityMemorySetSummary } from '@/features/memory-sets';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Bookmark, BookOpen, Check, Pencil, Search, SlidersHorizontal, Sparkles, Trophy, X } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEducationAuthoringPortalUrl } from '@/features/education/utils/educationAuthoringPortal';
import Toast from 'react-native-toast-message';

export function DiscoverMemorySetsScreen() {
  const { styles, theme } = useStyles();
  const { t } = useTranslation('library');
  const router = useRouter();
  const authoringPortalUrl = getEducationAuthoringPortalUrl();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const filtersSheetRef = useRef<BottomSheetModal>(null);
  const bookmarkMutation = useSetCommunityMemorySetBookmark();
  const [search, setSearch] = useState('');
  const [techniqueKey, setTechniqueKey] = useState<CommunityMemorySetFilters['techniqueKey']>();
  const [goalType, setGoalType] = useState<CommunityMemorySetFilters['goalType']>();
  const [sort, setSort] = useState<NonNullable<CommunityMemorySetFilters['sort']>>('featured');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const query = useCommunityMemorySets({ search: debouncedSearch, techniqueKey, goalType, sort, bookmarkedOnly });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const activeFilterCount = Number(Boolean(techniqueKey)) + Number(Boolean(goalType)) + Number(sort !== 'featured');
  const activeFilterSummary = [
    techniqueKey === 'palace' ? t('palaces') : techniqueKey === 'number-peg' ? t('numberPeg') : undefined,
    goalType === 'facts' ? t('goalFacts') : goalType === 'spelling' ? t('goalSpelling') : goalType === 'ordered-list' ? t('goalOrderedList') : goalType === 'names' ? t('goalNames') : goalType === 'custom' ? t('goalCustom') : undefined,
    sort === 'popular' ? t('sortPopular') : sort === 'newest' ? t('sortNewest') : undefined,
  ].filter(Boolean).join(' · ');

  const clearFilter = () => {
    setTechniqueKey(undefined);
    setGoalType(undefined);
  };

  const resetFilters = () => {
    clearFilter();
    setSort('featured');
    setBookmarkedOnly(false);
  };

  const toggleBookmark = (item: CommunityMemorySetSummary) => {
    bookmarkMutation.mutate({ memorySetId: item.id, isBookmarked: !item.isBookmarked }, {
      onSuccess: () => Toast.show({ type: 'success', text1: t(item.isBookmarked ? 'communityBookmarkRemoved' : 'communityBookmarked') }),
      onError: () => Toast.show({ type: 'error', text1: t('communityBookmarkError') }),
    });
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('discoverEyebrow')}
        title={t('discoverTitle')}
        description={t('discoverDescription')}
        hideBackButton
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <LinearGradient colors={[theme.violetDeep, '#8069D6', '#B66EBA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroCopy}>
                <View style={styles.heroBadge}><Sparkles size={13} color={theme.onAccent} /><Text style={styles.heroBadgeText}>{t('communityHeroEyebrow')}</Text></View>
                <Text style={styles.heroTitle}>{t('communityHeroTitle')}</Text>
                <Text style={styles.heroDescription}>{t('communityHeroBody')}</Text>
                <AnimatedPressable accessibilityRole="button" onPress={() => setSort('featured')} style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>{t('communityHeroAction')}</Text><ArrowRight size={16} color={theme.violetDeep} />
                </AnimatedPressable>
              </View>
              <View style={styles.heroArt} accessibilityElementsHidden>
                <View style={[styles.heroMemoryTile, styles.heroTileBack]}><Text style={styles.heroTileEmoji}>🏰</Text></View>
                <View style={[styles.heroMemoryTile, styles.heroTileFront]}><Text style={styles.heroTileNumber}>1 · 2 · 3</Text><Text style={styles.heroTileEmoji}>🧠</Text></View>
                <View style={styles.heroSparkle}><Sparkles size={15} color={theme.onAccent} /></View>
              </View>
            </LinearGradient>

            <View style={styles.quickLinks}>
              <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${t('communityLeaderboardShortcutTitle')}. ${t('communityLeaderboardShortcutBody')}`} onPress={() => router.push('/community/leaderboard' as Href)} style={[styles.quickLink, styles.quickLinkBoard]}>
                <LinearGradient colors={['#FFE27A', '#FFAE4D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickLinkGradient}>
                  <Trophy size={78} color="rgba(43,42,61,0.10)" style={styles.quickLinkWatermark} />
                  <View style={styles.quickLinkTop}>
                    <View style={[styles.quickLinkIcon, styles.quickLinkIconBoard]}><Trophy size={20} color="#8C5A00" /></View>
                    <View style={styles.quickLinkArrow}><ArrowRight size={15} color={theme.night} /></View>
                  </View>
                  <View style={styles.quickLinkCopy}><Text numberOfLines={1} style={styles.quickLinkTitle}>{t('communityLeaderboardShortcutTitle')}</Text><Text numberOfLines={1} style={styles.quickLinkBody}>{t('communityLeaderboardShortcutBody')}</Text></View>
                </LinearGradient>
              </AnimatedPressable>
              <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${t('communityPracticeShortcutTitle')}. ${t('communityPracticeShortcutBody')}`} onPress={() => router.push('/community/education' as Href)} style={[styles.quickLink, styles.quickLinkLearning]}>
                <LinearGradient colors={['#9DEBCB', '#5BCDD0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickLinkGradient}>
                  <BookOpen size={78} color="rgba(20,75,71,0.10)" style={styles.quickLinkWatermark} />
                  <View style={styles.quickLinkTop}>
                    <View style={[styles.quickLinkIcon, styles.quickLinkIconLearning]}><BookOpen size={20} color="#14645D" /></View>
                    <View style={styles.quickLinkArrow}><ArrowRight size={15} color={theme.night} /></View>
                  </View>
                  <View style={styles.quickLinkCopy}><Text numberOfLines={1} style={styles.quickLinkTitle}>{t('communityPracticeShortcutTitle')}</Text><Text numberOfLines={1} style={styles.quickLinkBody}>{t('communityPracticeShortcutBody')}</Text></View>
                </LinearGradient>
              </AnimatedPressable>
            </View>
            {authoringPortalUrl ? <AnimatedPressable
              accessibilityRole="link"
              accessibilityLabel={`${t('educationAuthoringTitle')}. ${t('educationAuthoringBody')}`}
              onPress={() => { void Linking.openURL(authoringPortalUrl).catch(() => Alert.alert(t('educationAuthoringUnavailableTitle'), t('educationAuthoringUnavailableBody'))); }}
              style={styles.creatorLink}>
              <Pencil size={15} color={theme.inkSoft} /><Text style={styles.creatorLinkText}>{t('educationAuthoringTitle')}</Text><ArrowRight size={14} color={theme.inkSoft} />
            </AnimatedPressable> : null}

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
                accessibilityLabel={t(bookmarkedOnly ? 'showAllCommunity' : 'showSavedCommunity')}
                accessibilityState={{ selected: bookmarkedOnly }}
                onPress={() => setBookmarkedOnly((current) => !current)}
                style={[styles.searchAction, styles.savedSearchAction, bookmarkedOnly && styles.searchActionSelected]}>
                <Bookmark size={17} color={bookmarkedOnly ? theme.violetDeep : theme.inkSoft} fill={bookmarkedOnly ? theme.violetDeep : 'none'} />
                <Text style={[styles.savedSearchActionText, bookmarkedOnly && styles.savedSearchActionTextSelected]}>{t('communitySavedFilterLabel')}</Text>
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityLabel={`${t('filtersButton')}${activeFilterCount ? `, ${activeFilterCount}` : ''}`}
                onPress={() => filtersSheetRef.current?.present()}
                style={styles.searchAction}>
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
              <Text style={styles.sectionTitle}>{sort === 'featured' ? t('sortFeatured') : sort === 'popular' ? t('sortPopular') : t('sortNewest')}</Text>
              <Text numberOfLines={1} style={styles.sectionSubtitle}>{t('communityFeedSubtitle')}</Text>
              <Text style={styles.resultCount}>{query.data?.pages[0]?.totalCount ?? items.length}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <CommunityMemoryCard item={item} onPress={() => router.push(`/community/memory-sets/${item.id}` as Href)} onToggleBookmark={() => toggleBookmark(item)} bookmarkPending={bookmarkMutation.isPending} t={t} />}
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
  const { styles, theme } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>{selected ? <Check size={14} color={theme.violetDeep} /> : null}</AnimatedPressable>;
}

function SortChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { styles, theme } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.sortChip, selected && styles.sortChipSelected]}><Text style={[styles.sortChipText, selected && styles.sortChipTextSelected]}>{label}</Text>{selected ? <Check size={14} color={theme.onAccent} /> : null}</AnimatedPressable>;
}

type DiscoverFiltersSheetProps = {
  techniqueKey?: CommunityMemorySetFilters['techniqueKey'];
  goalType?: CommunityMemorySetFilters['goalType'];
  sort: NonNullable<CommunityMemorySetFilters['sort']>;
  onTechniqueChange: (value: CommunityMemorySetFilters['techniqueKey']) => void;
  onGoalChange: (value: CommunityMemorySetFilters['goalType']) => void;
  onSortChange: (value: NonNullable<CommunityMemorySetFilters['sort']>) => void;
  onReset: () => void;
  onDone: () => void;
};

const DiscoverFiltersSheet = forwardRef<BottomSheetModal, DiscoverFiltersSheetProps>(
  ({ techniqueKey, goalType, sort, onTechniqueChange, onGoalChange, onSortChange, onReset, onDone }, ref) => {
    const { styles, theme } = useStyles();
    const { t } = useTranslation('library');
    const insets = useSafeAreaInsets();
    const toggleTechnique = (value: NonNullable<CommunityMemorySetFilters['techniqueKey']>) => onTechniqueChange(techniqueKey === value ? undefined : value);
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
          <FilterChip label={t('palaces')} selected={techniqueKey === 'palace'} onPress={() => toggleTechnique('palace')} />
          <FilterChip label={t('numberPeg')} selected={techniqueKey === 'number-peg'} onPress={() => toggleTechnique('number-peg')} />
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
        <View style={styles.sortControl}>
          <SortChip label={t('sortFeatured')} selected={sort === 'featured'} onPress={() => onSortChange('featured')} />
          <SortChip label={t('sortPopular')} selected={sort === 'popular'} onPress={() => onSortChange('popular')} />
          <SortChip label={t('sortNewest')} selected={sort === 'newest'} onPress={() => onSortChange('newest')} />
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

function CommunityMemoryCard({ item, onPress, onToggleBookmark, bookmarkPending, t }: {
  item: CommunityMemorySetSummary;
  onPress: () => void;
  onToggleBookmark: () => void;
  bookmarkPending: boolean;
  t: (key: any) => string;
}) {
  const { styles, theme } = useStyles();
  const isPalace = item.techniqueKey === 'palace';

  return (
    <View style={styles.cardContainer}>
      <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}. ${item.itemCount} ${t('items')}. ${item.copyCount} ${t('copies')}. ${item.author.displayName}. ${t('communityOpenAction')}`} onPress={onPress} style={styles.memoryCard}>
        <View style={styles.cardArtwork}>
          {item.coverImageUrl ? <AppImage imageUrl={item.coverImageUrl} style={styles.coverImage} /> : (
            <LinearGradient colors={isPalace ? ['#DED2FF', '#AFA0FF'] : ['#FFD8AD', '#FFBDAA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverFallback}>
              <Sparkles size={58} color="rgba(255,255,255,0.35)" style={styles.coverWatermark} />
              <View style={[styles.coverTile, styles.coverTileBack]} />
              <View style={styles.coverTile}>
                <Text style={styles.coverNumber}>{isPalace ? 'A · B · C' : '1 · 2 · 3'}</Text>
                <Text style={styles.coverEmoji}>{isPalace ? '🏰' : '🕯️'}</Text>
              </View>
            </LinearGradient>
          )}
          <View style={[styles.coverTechniqueTag, isPalace ? styles.palaceTag : styles.pegTag]}>
            <Text style={[styles.coverTechniqueText, isPalace ? styles.palaceTagText : styles.pegTagText]}>{isPalace ? t('techniquePalace') : t('techniqueNumberPeg')}</Text>
          </View>
          {item.featuredAt ? <View style={styles.featuredTag}><Sparkles size={11} color={theme.onAccent} /><Text style={styles.featuredTagText}>{t('sortFeatured')}</Text></View> : null}
        </View>
        <View style={styles.memoryCardCopy}>
          <View style={styles.cardTitleRow}><Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text></View>
          <View style={styles.cardGoalPill}><Text numberOfLines={1} style={styles.cardGoal}>{goalLabel(item.goalType, t)}</Text></View>
          {item.description ? <Text numberOfLines={1} style={styles.cardDescription}>{item.description}</Text> : null}
          <View style={styles.cardMetaRow}>
            <View style={styles.authorAvatar}>{item.author.avatarUrl ? <AppImage imageUrl={item.author.avatarUrl} style={styles.authorAvatarImage} /> : <Text style={styles.authorInitial}>{item.author.displayName.slice(0, 1).toUpperCase()}</Text>}</View>
            <Text numberOfLines={1} style={styles.authorName}>{item.author.displayName}</Text>
            <Text numberOfLines={1} style={styles.cardCopies}>{item.copyCount} {t('copies')}</Text>
          </View>
          <View style={styles.cardBottomRow}>
            <View style={styles.cardStats}><BookOpen size={13} color={theme.inkSoft} /><Text style={styles.cardItemCount}>{item.itemCount} {t('items')}</Text></View>
            <View style={styles.openAction}><Text numberOfLines={1} style={styles.openActionText}>{t('communityOpenAction')}</Text><ArrowRight size={12} color={theme.violetDeep} /></View>
          </View>
        </View>
      </AnimatedPressable>
      <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected: item.isBookmarked, disabled: bookmarkPending }} accessibilityLabel={t(item.isBookmarked ? 'communityBookmarkRemoveAction' : 'communityBookmarkAction')} disabled={bookmarkPending} onPress={onToggleBookmark} style={[styles.bookmarkButton, item.isBookmarked && styles.bookmarkButtonSelected]}>
        <Bookmark size={17} color={item.isBookmarked ? theme.sunDeep : theme.inkSoft} fill={item.isBookmarked ? theme.sun : 'none'} />
      </AnimatedPressable>
    </View>
  );
}

function goalLabel(goal: string, t: (key: any) => string) {
  const key = `goal${goal.replace(/(^|-)(.)/g, (_, __, letter) => letter.toUpperCase())}`;
  return t(key);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { gap: 12, padding: 16, paddingBottom: 30 },
  headerContent: { gap: 10 },
  hero: { alignItems: 'center', borderRadius: 24, flexDirection: 'row', gap: 4, minHeight: 188, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 14 },
  heroCopy: { flex: 1, gap: 9, zIndex: 1 },
  heroBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: 999, flexDirection: 'row', gap: 5, minHeight: 26, paddingHorizontal: 9 },
  heroBadgeText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: 22, lineHeight: 28, maxWidth: 230 },
  heroDescription: { color: 'rgba(255,255,255,0.86)', fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, maxWidth: 220 },
  heroButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.paper, borderRadius: 999, flexDirection: 'row', gap: 7, marginTop: 2, minHeight: 44, paddingHorizontal: 14 },
  heroButtonText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  heroArt: { height: 138, position: 'relative', width: 108 },
  heroMemoryTile: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.7)', borderRadius: 18, borderWidth: 1.5, height: 100, justifyContent: 'center', position: 'absolute', width: 74 },
  heroTileBack: { backgroundColor: '#E5DFFF', right: 5, top: 7, transform: [{ rotate: '10deg' }] },
  heroTileFront: { backgroundColor: '#FFF5D9', left: 3, top: 30, transform: [{ rotate: '-8deg' }] },
  heroTileEmoji: { fontSize: 30 },
  heroTileNumber: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 11, marginBottom: 3 },
  heroSparkle: { alignItems: 'center', backgroundColor: theme.berry, borderColor: theme.paper, borderRadius: 16, borderWidth: 2, height: 33, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 33 },
  quickLinks: { flexDirection: 'row', gap: 10 },
  quickLink: { borderRadius: 22, flex: 1, minHeight: 112, overflow: 'hidden' },
  quickLinkBoard: { borderColor: '#F3B14C', borderWidth: 1 },
  quickLinkLearning: { borderColor: '#63C6AD', borderWidth: 1 },
  quickLinkGradient: { borderRadius: 21, flex: 1, gap: 10, justifyContent: 'space-between', minHeight: 110, overflow: 'hidden', padding: 12 },
  quickLinkWatermark: { bottom: -14, opacity: 0.95, position: 'absolute', right: -13, transform: [{ rotate: '-12deg' }] },
  quickLinkTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  quickLinkIcon: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.75)', borderRadius: 16, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  quickLinkIconBoard: { backgroundColor: 'rgba(255,255,255,0.62)' },
  quickLinkIconLearning: { backgroundColor: 'rgba(255,255,255,0.62)' },
  quickLinkCopy: { gap: 3, minWidth: 0, zIndex: 1 },
  quickLinkTitle: { color: theme.night, fontFamily: typography.displayExtraBold, fontSize: 13 },
  quickLinkBody: { color: theme.night, fontFamily: typography.bodySemibold, fontSize: 10, opacity: 0.78 },
  quickLinkArrow: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 999, height: 30, justifyContent: 'center', width: 30, zIndex: 1 },
  creatorLink: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: 4 },
  creatorLinkText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  searchBox: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 17, borderWidth: 1.5, flexDirection: 'row', minHeight: 54, paddingLeft: 14, paddingRight: 5 },
  searchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 14, marginHorizontal: 10, minHeight: 46 },
  searchAction: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 13, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  savedSearchAction: { flexDirection: 'row', gap: 5, paddingHorizontal: 9, width: 'auto' },
  savedSearchActionText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  savedSearchActionTextSelected: { color: theme.violetDeep },
  searchActionSelected: { backgroundColor: theme.violetTint },
  filterCount: { alignItems: 'center', backgroundColor: theme.berry, borderColor: theme.paper, borderRadius: 8, borderWidth: 1.5, height: 16, justifyContent: 'center', minWidth: 16, paddingHorizontal: 3, position: 'absolute', right: 1, top: 1 },
  filterCountText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 8, lineHeight: 10 },
  activeFiltersRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 1 },
  activeFiltersPill: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 999, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, minHeight: 34, paddingHorizontal: 11 },
  activeFiltersText: { color: theme.violetDeep, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  sortControl: { backgroundColor: theme.canvas, borderRadius: 16, flexDirection: 'row', gap: 4, marginTop: 8, padding: 4 },
  sortChip: { alignItems: 'center', borderRadius: 12, flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 },
  sortChipSelected: { backgroundColor: theme.violetDeep },
  sortChipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sortChipTextSelected: { color: theme.onAccent },
  clearFiltersButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: 16, height: 44, justifyContent: 'center', width: 44 },
  filterLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, letterSpacing: .2, marginTop: 15 },
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 14 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sheetTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 20 },
  sheetDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, marginTop: 3 },
  resetButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, justifyContent: 'center', minHeight: 40, paddingHorizontal: 12 },
  resetText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 999, borderWidth: 1.25, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 42, paddingHorizontal: 13 },
  chipSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  chipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  chipTextSelected: { color: theme.violetDeep },
  doneButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: theme.violetDeep, borderRadius: 15, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 22, minHeight: 48 },
  doneButtonText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 2, marginTop: 3 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18 },
  sectionSubtitle: { color: theme.inkSoft, flex: 1, fontFamily: typography.bodySemibold, fontSize: 10 },
  resultCount: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 },
  cardContainer: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 20, borderWidth: 1, elevation: 2, overflow: 'hidden', position: 'relative' },
  memoryCard: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 138, padding: 10 },
  cardArtwork: { borderRadius: 15, flexShrink: 0, height: 118, overflow: 'hidden', position: 'relative', width: 92 },
  coverImage: { height: '100%', width: '100%' },
  coverFallback: { alignItems: 'center', flex: 1, justifyContent: 'center', overflow: 'hidden' },
  coverWatermark: { position: 'absolute', right: -12, top: -10, transform: [{ rotate: '16deg' }] },
  coverTile: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,255,255,0.9)', borderRadius: 15, borderWidth: 1, height: 78, justifyContent: 'center', width: 62 },
  coverTileBack: { backgroundColor: 'rgba(255,255,255,0.38)', position: 'absolute', transform: [{ rotate: '12deg' }, { translateX: 9 }, { translateY: -2 }] },
  coverNumber: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: 9, marginBottom: 2 },
  coverEmoji: { fontSize: 30 },
  coverTechniqueTag: { alignItems: 'center', borderRadius: 999, left: 7, paddingHorizontal: 8, paddingVertical: 5, position: 'absolute', top: 7 },
  coverTechniqueText: { fontFamily: typography.bodyExtraBold, fontSize: 8 },
  palaceTagText: { color: theme.violetDeep },
  pegTagText: { color: theme.berryDeep },
  featuredTag: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: 999, bottom: 7, flexDirection: 'row', gap: 3, left: 7, paddingHorizontal: 7, paddingVertical: 5, position: 'absolute' },
  featuredTagText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 8 },
  memoryCardCopy: { flex: 1, gap: 6, justifyContent: 'center', minWidth: 0, paddingVertical: 4 },
  palaceTag: { backgroundColor: 'rgba(255,255,255,0.9)' },
  pegTag: { backgroundColor: 'rgba(255,255,255,0.9)' },
  cardTitleRow: { paddingRight: 46 },
  cardGoalPill: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: 999, maxWidth: '100%', paddingHorizontal: 8, paddingVertical: 4 },
  cardGoal: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  cardTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, lineHeight: 19 },
  cardDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 10, lineHeight: 14 },
  cardMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 0 },
  authorAvatar: { alignItems: 'center', backgroundColor: theme.skyTint, borderRadius: 9, height: 20, justifyContent: 'center', overflow: 'hidden', width: 20 },
  authorAvatarImage: { height: '100%', width: '100%' },
  authorInitial: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 9 },
  authorName: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodySemibold, fontSize: 9 },
  cardCopies: { color: theme.berryDeep, flexShrink: 0, fontFamily: typography.bodyExtraBold, fontSize: 8 },
  cardBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 1 },
  cardStats: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  cardItemCount: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 9 },
  openAction: { alignItems: 'center', backgroundColor: theme.sunTint, borderRadius: 999, flexDirection: 'row', gap: 3, justifyContent: 'center', minHeight: 30, paddingHorizontal: 8 },
  openActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 8 },
  bookmarkButton: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 44 },
  bookmarkButtonSelected: { backgroundColor: theme.sunTint },
  separator: { height: 1 }, loading: { height: 200, overflow: 'hidden' }, empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 64 }, emptyEmoji: { fontSize: 34 }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, marginTop: 11, textAlign: 'center' }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 19, marginTop: 5, textAlign: 'center' }, retry: { backgroundColor: theme.sun, borderRadius: 13, marginTop: 15, paddingHorizontal: 18, paddingVertical: 11 }, retryText: { color: theme.onSun, fontFamily: typography.bodyExtraBold, fontSize: 13 }, loadMore: { alignItems: 'center', alignSelf: 'center', backgroundColor: theme.violetTint, borderRadius: 14, flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 17, minHeight: 44, paddingHorizontal: 17 }, loadMoreText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 }, footerSpace: { height: 10 },
}));
