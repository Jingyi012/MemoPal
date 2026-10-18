import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { HeaderIconButton } from '@/components/ui/HeaderIconButton';
import LoadingView from '@/components/LoadingView';
import { BookOpen, Bookmark, ChevronLeft, Clock3, Search, Sparkles } from '@/core/icons';
import { useDebouncedValue } from '@/core/hooks/useDebouncedValue';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useEducationCopy } from '@/features/education/i18n';
import { useEducationPublicCourses } from '@/features/education/hooks/useEducationPracticeItems';
import { EducationPublicResourceCard } from '@/features/education/components/EducationPublicResourceCard';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EducationPublicCoursesScreen() {
  const copy = useEducationCopy();
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const courses = useEducationPublicCourses(debouncedSearch);
  const data = useMemo(() => courses.data ?? [], [courses.data]);
  const returnToCommunity = () => router.canGoBack()
    ? router.back()
    : router.replace('/(tabs)/community' as Href);

  return <View style={styles.page}>
    <CommonHeader
      title={copy.publicCoursesTitle}
      leftComponent={<HeaderIconButton icon={ChevronLeft} accessibilityLabel={copy.backToCommunity} onPress={returnToCommunity} />}
    />
    <FlatList
      data={data}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={courses.isRefetching} onRefresh={() => void courses.refetch()} />}
      ListHeaderComponent={<View style={styles.sections}>
        <LinearGradient colors={['#7657EA', '#A17AF4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroDecoration}><View style={styles.heroOrbit} /><Sparkles size={37} color="rgba(255,255,255,0.45)" /></View>
          <View style={styles.heroBadge}><Sparkles size={12} color="#FFFFFF" /><Text style={styles.heroBadgeText}>{copy.publicPracticeHeroBadge}</Text></View>
          <View style={styles.heroMain}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{copy.publicPracticeHeroTitle}</Text>
              <Text numberOfLines={2} style={styles.heroDescription}>{copy.publicCoursesDescription}</Text>
            </View>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.heroArtwork}>
              <View style={styles.heroCardBack}><View style={styles.heroCardLine} /><View style={styles.heroCardLineShort} /></View>
              <View style={styles.heroCardGold}><Sparkles size={13} color={theme.onSun} /></View>
              <View style={styles.heroBookTile}><BookOpen size={30} color="#FFFFFF" /></View>
              <View style={styles.heroSparkle}><Sparkles size={12} color={theme.sunDeep} /></View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.shortcutRow}>
        <EducationPublicResourceCard
          title={copy.publicSavedCourses}
          detail={copy.publicSavedCoursesDescription}
          icon={Bookmark}
          compact
          tone="gold"
          onPress={() => router.push('/community/education/saved' as Href)}
        />
        <EducationPublicResourceCard
          title={copy.publicPracticeHistory}
          detail={copy.publicPracticeHistoryDescription}
          icon={Clock3}
          compact
          onPress={() => router.push('/community/education/history' as Href)}
        />
        </View>

        <View style={styles.searchBox}>
          <Search size={19} color={theme.violetDeep} />
          <TextInput
            accessibilityLabel={copy.publicCoursesSearch}
            placeholder={copy.publicCoursesSearch}
            placeholderTextColor={theme.inkSoft}
            returnKeyType="search"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>{copy.publicPracticeListTitle}</Text>
          {!courses.isLoading && !courses.isError ? <View style={styles.resultCount}><BookOpen size={12} color={theme.violetDeep} /><Text style={styles.resultCountText}>{copy.publicPracticeCourseCount(data.length)}</Text></View> : null}
        </View>
      </View>}
      renderItem={({ item }) => <EducationPublicResourceCard
        title={item.title}
        detail={copy.publicCourseAuthor(item.authorDisplayName)}
        metadata={`${copy.publicCourseAssessmentCount(item.assessmentCount)} · ${copy.practiceQuestionCount(item.questionCount)}${item.isSaved ? ` · ${copy.publicCourseSaved}` : ''}`}
        onPress={() => router.push(`/community/education/${item.id}` as Href)}
      />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={courses.isLoading ? <View style={styles.state}><LoadingView description={copy.loading} /></View>
        : canShowRequestErrors && courses.isError ? <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.body}>{copy.publicCoursesError}</Text>
          <AnimatedPressable accessibilityRole="button" onPress={() => void courses.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>{copy.retry}</Text>
          </AnimatedPressable>
        </View>
          : isOffline ? <View style={styles.notice}>
            <Text accessibilityRole="alert" style={styles.body}>{copy.publicCoursesOffline}</Text>
            <AnimatedPressable accessibilityRole="button" onPress={() => void courses.refetch()} style={styles.retry}>
              <Text style={styles.retryText}>{copy.retry}</Text>
            </AnimatedPressable>
          </View>
            : <View style={styles.emptyState}>
              <View style={styles.emptyIcon}><BookOpen size={23} color={theme.violetDeep} /></View>
              <Text style={styles.empty}>{copy.publicCoursesEmpty}</Text>
            </View>}
      ListFooterComponent={<View style={styles.footer} />}
    />
  </View>;
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { backgroundColor: theme.canvas, flex: 1 },
  content: { gap: 9, padding: 14, paddingBottom: 30 },
  sections: { gap: 11, marginBottom: 3 },
  heroCard: { borderRadius: 23, gap: 8, minHeight: 132, overflow: 'hidden', padding: 13 },
  heroDecoration: { alignItems: 'center', flexDirection: 'row', gap: 7, opacity: 0.6, position: 'absolute', right: 12, top: 14 },
  heroOrbit: { borderColor: 'rgba(255,255,255,0.25)', borderRadius: 40, borderWidth: 1, height: 62, position: 'absolute', right: -3, top: -6, width: 62 },
  heroBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, flexDirection: 'row', gap: 5, minHeight: 25, paddingHorizontal: 9 },
  heroBadgeText: { color: '#FFFFFF', fontFamily: typography.bodyExtraBold, fontSize: 9, letterSpacing: 0.3 },
  heroMain: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heroCopy: { flex: 1, gap: 3, maxWidth: '74%' },
  heroTitle: { color: '#FFFFFF', fontFamily: typography.displayExtraBold, fontSize: 19, lineHeight: 24 },
  heroDescription: { color: 'rgba(255,255,255,0.9)', fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16 },
  heroArtwork: { height: 64, position: 'relative', width: 73 },
  heroCardBack: { backgroundColor: 'rgba(226,217,255,0.9)', borderColor: 'rgba(255,255,255,0.72)', borderRadius: 11, borderWidth: 1, height: 43, left: 1, padding: 8, position: 'absolute', top: 11, transform: [{ rotate: '-12deg' }], width: 38 },
  heroCardLine: { backgroundColor: 'rgba(105,80,204,0.45)', borderRadius: 2, height: 3, marginTop: 7, width: 20 },
  heroCardLineShort: { backgroundColor: 'rgba(105,80,204,0.28)', borderRadius: 2, height: 3, marginTop: 4, width: 14 },
  heroCardGold: { alignItems: 'center', backgroundColor: theme.sun, borderColor: '#FFFFFF', borderRadius: 11, borderWidth: 1.5, height: 29, justifyContent: 'center', position: 'absolute', right: 1, top: 10, transform: [{ rotate: '12deg' }], width: 29 },
  heroBookTile: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.7)', borderRadius: 17, borderWidth: 1.5, bottom: 0, height: 47, justifyContent: 'center', position: 'absolute', right: 13, transform: [{ rotate: '4deg' }], width: 47 },
  heroSparkle: { alignItems: 'center', backgroundColor: theme.sun, borderColor: '#FFFFFF', borderRadius: 11, borderWidth: 1.5, height: 23, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 23 },
  shortcutRow: { flexDirection: 'row', gap: 9 },
  searchBox: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 13 },
  searchInput: { color: theme.ink, flex: 1, fontFamily: typography.bodySemibold, fontSize: 13, minHeight: 48, paddingVertical: 0 },
  resultsHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 1, minHeight: 28 },
  resultsTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 16 },
  resultCount: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 999, flexDirection: 'row', gap: 5, minHeight: 25, paddingHorizontal: 9 },
  resultCountText: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  separator: { height: 9 },
  state: { minHeight: 120, justifyContent: 'center', overflow: 'hidden' },
  notice: { backgroundColor: theme.violetTint, borderColor: theme.violetLine, borderRadius: 17, borderWidth: 1.5, gap: 9, padding: 14 },
  body: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 13, lineHeight: 18 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: theme.violetDeep, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 15 },
  retryText: { color: theme.onAccent, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  emptyState: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.violetLine, borderRadius: 18, borderWidth: 1.5, gap: 10, justifyContent: 'center', minHeight: 130, padding: 18 },
  emptyIcon: { alignItems: 'center', backgroundColor: theme.violetTint, borderRadius: 15, height: 44, justifyContent: 'center', width: 44 },
  empty: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  footer: { height: 20 },
}));
