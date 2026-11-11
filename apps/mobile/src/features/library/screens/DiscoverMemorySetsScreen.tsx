import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { appArtworkSizes, appRadii, appSpacing, appTextStyles } from '@/theme/designSystem';
import { CommunityExploreHeader } from '../components/CommunityExploreHeader';
import { createThemedStyles } from '@/theme/createThemedStyles';
import AnimatedPressable from '@/components/AnimatedPressable';
import { AppButton } from '@/components/ui/AppButton';
import { AppImage } from '@/components/AppImage';
import { LearningHeader as CommonHeader } from '@/features/education/components/LearningHeader';
import { LearningIconButton } from '@/features/education/components/LearningIconButton';
import CustomBottomSheetModal from '@/components/CustomBottomSheetModal';
import LoadingView from '@/components/LoadingView';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useCommunityMemorySets, useSetCommunityMemorySetBookmark } from '@/features/memory-sets';
import type { CommunityMemorySetFilters, CommunityMemorySetSummary } from '@/features/memory-sets';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ArrowRight, Bookmark, BookOpen, Check, Pencil, Search, SlidersHorizontal, Sparkles, X } from '@/core/icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, forwardRef, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, StyleSheet, View } from 'react-native';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEducationAuthoringPortalUrl } from '@/features/education/utils/educationAuthoringPortal';
import Toast from 'react-native-toast-message';

export function DiscoverMemorySetsScreen({ workspaceNavigation }: { workspaceNavigation?: ReactNode } = {}) {
  const { styles, theme } = useStyles();
  const { t, language } = useTranslation('library');
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
        title={language === 'zh' ? '社区' : 'Community'}
        description={undefined} additionalContent={workspaceNavigation}
        showAiCredits={false}
        actions={[{ component: <LearningIconButton variant="plain" icon="trophy-outline" label={t('communityLeaderboardShortcutTitle')} onPress={() => router.push('/community/leaderboard' as Href)} /> }]}
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
            <CommunityExploreHeader />

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
        ListEmptyComponent={!isOffline && query.isLoading ? <View style={styles.loading}><LoadingView description={t('discoverLoading')} /></View> : canShowRequestErrors && query.isError ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🫧</Text><Text style={styles.emptyTitle}>{t('discoverUnavailable')}</Text><Text style={styles.emptyBody}>{t('connectionRetry')}</Text><AppButton label={t('retry')} size="compact" onPress={() => void query.refetch()} style={styles.retry} /></View> : !isOffline ? <View style={styles.empty}><Text style={styles.emptyEmoji}>🌱</Text><Text style={styles.emptyTitle}>{t('discoverEmpty')}</Text><Text style={styles.emptyBody}>{t('discoverEmptyBody')}</Text></View> : null}
        ListFooterComponent={<View>{!isOffline && query.hasNextPage ? <AppButton label={t('loadMore')} variant="secondary" size="compact" loading={query.isFetchingNextPage} disabled={query.isFetchingNextPage} trailingIcon={query.isFetchingNextPage ? undefined : ArrowRight} onPress={() => void query.fetchNextPage()} style={styles.loadMore} /> : <View style={styles.footerSpace} />}{authoringPortalUrl ? <AnimatedPressable accessibilityRole="link" onPress={() => { void Linking.openURL(authoringPortalUrl).catch(() => Alert.alert(t('educationAuthoringUnavailableTitle'), t('educationAuthoringUnavailableBody'))); }} style={styles.creatorLink}><Pencil size={15} color={theme.inkSoft} /><Text style={styles.creatorLinkText}>{t('educationAuthoringTitle')}</Text><ArrowRight size={14} color={theme.inkSoft} /></AnimatedPressable> : null}</View>}
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
    const { styles } = useStyles();
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

        <AppButton label={t('filtersDone')} fullWidth icon={Check} onPress={onDone} style={styles.doneButton} />
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
            {item.copyCount > 0 ? <Text numberOfLines={1} style={styles.cardCopies}>{item.copyCount} {t('copies')}</Text> : null}
          </View>
          <View style={styles.cardBottomRow}>
            <View style={styles.cardStats}><BookOpen size={13} color={theme.inkSoft} /><Text style={styles.cardItemCount}>{item.itemCount} {t('items')}</Text></View>

          </View>
        </View>
      </AnimatedPressable>
      <AnimatedPressable accessibilityRole="button" accessibilityState={{ selected: item.isBookmarked, disabled: bookmarkPending }} accessibilityLabel={t(item.isBookmarked ? 'communityBookmarkRemoveAction' : 'communityBookmarkAction')} disabled={bookmarkPending} onPress={onToggleBookmark} style={[styles.bookmarkButton, item.isBookmarked && styles.bookmarkButtonSelected]}>
        <Bookmark size={17} color={item.isBookmarked ? theme.violetDeep : theme.inkSoft} fill={item.isBookmarked ? theme.violetDeep : 'none'} />
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
  content: { gap: appSpacing.md, padding: appSpacing.lg, paddingBottom: 30 },
  headerContent: { gap: 10 },
  hero: { alignItems: 'center', borderRadius: appRadii.hero, flexDirection: 'row', gap: appSpacing.xs, minHeight: 188, overflow: 'hidden', paddingHorizontal: appSpacing.lg, paddingVertical: 14 },
  heroCopy: { flex: 1, gap: 9, zIndex: 1 },
  heroBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: appRadii.pill, flexDirection: 'row', gap: 5, minHeight: 26, paddingHorizontal: 9 },
  heroBadgeText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTitle: { color: theme.onAccent, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.prompt.fontSize, lineHeight: appTextStyles.prompt.lineHeight, maxWidth: 230 },
  heroDescription: { color: 'rgba(255,255,255,0.86)', fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight, maxWidth: 220 },
  heroButton: { alignSelf: 'flex-start', marginTop: 2 },
  heroArt: { height: 138, position: 'relative', width: 108 },
  heroMemoryTile: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.7)', borderRadius: appRadii.card, borderWidth: 1.5, height: 100, justifyContent: 'center', position: 'absolute', width: 74 },
  heroTileBack: { backgroundColor: '#E5DFFF', right: 5, top: 7, transform: [{ rotate: '10deg' }] },
  heroTileFront: { backgroundColor: '#FFF5D9', left: 3, top: 30, transform: [{ rotate: '-8deg' }] },
  heroTileEmoji: { fontSize: appArtworkSizes.medium },
  heroTileNumber: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize, marginBottom: 3 },
  heroSparkle: { alignItems: 'center', backgroundColor: theme.berry, borderColor: theme.paper, borderRadius: appRadii.control, borderWidth: 2, height: 33, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 33 },
  quickLinks: { flexDirection: 'row', gap: 10 },
  quickLink: { borderRadius: appRadii.card, flex: 1, minHeight: 112, overflow: 'hidden' },
  quickLinkBoard: { borderColor: '#F3B14C', borderWidth: 1 },
  quickLinkLearning: { borderColor: '#63C6AD', borderWidth: 1 },
  quickLinkGradient: { borderRadius: 21, flex: 1, gap: 10, justifyContent: 'space-between', minHeight: 110, overflow: 'hidden', padding: appSpacing.md },
  quickLinkWatermark: { bottom: -14, opacity: 0.95, position: 'absolute', right: -13, transform: [{ rotate: '-12deg' }] },
  quickLinkTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 },
  quickLinkIcon: { alignItems: 'center', borderColor: 'rgba(255,255,255,0.75)', borderRadius: appRadii.control, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  quickLinkIconBoard: { backgroundColor: 'rgba(255,255,255,0.62)' },
  quickLinkIconLearning: { backgroundColor: 'rgba(255,255,255,0.62)' },
  quickLinkCopy: { gap: 3, minWidth: 0, zIndex: 1 },
  quickLinkTitle: { color: theme.night, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.small.fontSize },
  quickLinkBody: { color: theme.night, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, opacity: 0.78 },
  quickLinkArrow: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: appRadii.pill, height: 30, justifyContent: 'center', width: 30, zIndex: 1 },
  creatorLink: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 44, paddingHorizontal: appSpacing.xs },
  creatorLinkText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  searchBox: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1.5, flexDirection: 'row', minHeight: 54, paddingLeft: 14, paddingRight: 5 },
  searchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: appTextStyles.label.fontSize, marginHorizontal: 10, minHeight: 46 },
  searchAction: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: appRadii.control, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  savedSearchAction: { flexDirection: 'row', gap: 5, paddingHorizontal: 9, width: 'auto' },
  savedSearchActionText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  savedSearchActionTextSelected: { color: theme.violetDeep },
  searchActionSelected: { backgroundColor: theme.violetTint },
  filterCount: { alignItems: 'center', backgroundColor: theme.berry, borderColor: theme.paper, borderRadius: 8, borderWidth: 1.5, height: 16, justifyContent: 'center', minWidth: 16, paddingHorizontal: 3, position: 'absolute', right: 1, top: 1 },
  filterCountText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  activeFiltersRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 1 },
  activeFiltersPill: { alignItems: 'center', backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: appRadii.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, minHeight: 34, paddingHorizontal: 11 },
  activeFiltersText: { color: theme.violetDeep, flex: 1, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  sortControl: { backgroundColor: theme.canvas, borderRadius: appRadii.control, flexDirection: 'row', gap: appSpacing.xs, marginTop: appSpacing.sm, padding: appSpacing.xs },
  sortChip: { alignItems: 'center', borderRadius: appRadii.control, flex: 1, flexDirection: 'row', gap: appSpacing.xs, justifyContent: 'center', minHeight: 44, paddingHorizontal: 7 },
  sortChipSelected: { backgroundColor: theme.violetDeep },
  sortChipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  sortChipTextSelected: { color: theme.onAccent },
  clearFiltersButton: { alignItems: 'center', backgroundColor: theme.canvas, borderRadius: appRadii.control, height: 44, justifyContent: 'center', width: 44 },
  filterLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize, letterSpacing: .2, marginTop: 15 },
  sheetBackground: { backgroundColor: theme.paper, borderRadius: 30 },
  sheetContent: { paddingHorizontal: appSpacing.xl, paddingTop: 14 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  sheetTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.screenTitle.fontSize },
  sheetDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, marginTop: 3 },
  resetButton: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, justifyContent: 'center', minHeight: 40, paddingHorizontal: appSpacing.md },
  resetText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  sheetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: appSpacing.sm, marginTop: appSpacing.sm },
  chip: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: appRadii.pill, borderWidth: 1.25, flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 42, paddingHorizontal: 13 },
  chipSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  chipText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  chipTextSelected: { color: theme.violetDeep },
  doneButton: { marginTop: 22 },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 2, marginTop: 3 },
  sectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize },
  sectionSubtitle: { color: theme.inkSoft, flex: 1, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  resultCount: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  cardContainer: { backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: appRadii.card, borderWidth: 1, elevation: 2, overflow: 'hidden', position: 'relative' },
  memoryCard: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.md, minHeight: 148, padding: 14 },
  cardArtwork: { borderRadius: appRadii.control, flexShrink: 0, height: 110, overflow: 'hidden', position: 'relative', width: 76 },
  coverImage: { height: '100%', width: '100%' },
  coverFallback: { alignItems: 'center', flex: 1, justifyContent: 'center', overflow: 'hidden' },
  coverWatermark: { position: 'absolute', right: -12, top: -10, transform: [{ rotate: '16deg' }] },
  coverTile: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.82)', borderColor: 'rgba(255,255,255,0.9)', borderRadius: appRadii.control, borderWidth: 1, height: 78, justifyContent: 'center', width: 62 },
  coverTileBack: { backgroundColor: 'rgba(255,255,255,0.38)', position: 'absolute', transform: [{ rotate: '12deg' }, { translateX: 9 }, { translateY: -2 }] },
  coverNumber: { color: theme.berryDeep, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.caption.fontSize, marginBottom: 2 },
  coverEmoji: { fontSize: appArtworkSizes.medium },
  coverTechniqueTag: { alignItems: 'center', borderRadius: appRadii.pill, left: 7, paddingHorizontal: appSpacing.sm, paddingVertical: 5, position: 'absolute', top: 7 },
  coverTechniqueText: { fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  palaceTagText: { color: theme.violetDeep },
  pegTagText: { color: theme.berryDeep },
  featuredTag: { alignItems: 'center', backgroundColor: theme.violetDeep, borderRadius: appRadii.pill, bottom: 7, flexDirection: 'row', gap: 3, left: 7, paddingHorizontal: 7, paddingVertical: 5, position: 'absolute' },
  featuredTagText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  memoryCardCopy: { flex: 1, gap: 6, justifyContent: 'center', minWidth: 0, paddingVertical: appSpacing.xs },
  palaceTag: { backgroundColor: 'rgba(255,255,255,0.9)' },
  pegTag: { backgroundColor: 'rgba(255,255,255,0.9)' },
  cardTitleRow: { paddingRight: 46 },
  cardGoalPill: { alignSelf: 'flex-start', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, maxWidth: '100%', paddingHorizontal: appSpacing.sm, paddingVertical: appSpacing.xs },
  cardGoal: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  cardTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, lineHeight: appTextStyles.sectionTitle.lineHeight },
  cardDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize, lineHeight: appTextStyles.caption.lineHeight },
  cardMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, minWidth: 0 },
  authorAvatar: { alignItems: 'center', backgroundColor: theme.skyTint, borderRadius: 9, height: 20, justifyContent: 'center', overflow: 'hidden', width: 20 },
  authorAvatarImage: { height: '100%', width: '100%' },
  authorInitial: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  authorName: { color: theme.inkSoft, flexShrink: 1, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  cardCopies: { color: theme.berryDeep, flexShrink: 0, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  cardBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: appSpacing.sm, marginTop: appSpacing.xs },
  cardStats: { alignItems: 'center', flexDirection: 'row', gap: appSpacing.xs },
  cardItemCount: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.caption.fontSize },
  openAction: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: appRadii.pill, flexDirection: 'row', gap: 3, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 },
  openActionText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: appTextStyles.caption.fontSize },
  bookmarkButton: { alignItems: 'center', backgroundColor: theme.canvas, borderColor: theme.line, borderRadius: appRadii.control, borderWidth: 1, height: 44, justifyContent: 'center', position: 'absolute', right: 10, top: 10, width: 44 },
  bookmarkButtonSelected: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  separator: { height: 1 }, loading: { height: 200, overflow: 'hidden' }, empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 64 }, emptyEmoji: { fontSize: appArtworkSizes.medium }, emptyTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: appTextStyles.sectionTitle.fontSize, marginTop: 11, textAlign: 'center' }, emptyBody: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: appTextStyles.small.fontSize, lineHeight: appTextStyles.small.lineHeight, marginTop: 5, textAlign: 'center' }, retry: { alignSelf: 'center', marginTop: 15 }, loadMore: { alignSelf: 'center', marginTop: 17 }, footerSpace: { height: 10 },
}));
