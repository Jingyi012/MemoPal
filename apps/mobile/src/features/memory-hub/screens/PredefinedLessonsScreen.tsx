import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { useTranslation } from '@/core/i18n/useTranslation';
import { useInfinitePredefinedMemoryLessons } from '@/features/predefined-memory-lessons';
import type { PredefinedMemoryLesson } from '@/features/predefined-memory-lessons';
import { memopalTheme as theme } from '@/theme/memopalTheme';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function PredefinedLessonsScreen({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const { language, t } = useTranslation('practice');
  const lessons = useInfinitePredefinedMemoryLessons();
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const categories = useMemo(() => {
    const map = new Map<string, PredefinedMemoryLesson['category']>();
    (lessons.data?.pages.flatMap((page) => page.items) ?? []).forEach((lesson) => map.set(lesson.categoryId, lesson.category));
    return [...map.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [lessons.data]);
  const allLessons = lessons.data?.pages.flatMap((page) => page.items) ?? [];
  const visible = allLessons.filter((lesson) => {
    const matchesCategory = categoryId === 'all' || lesson.categoryId === categoryId;
    const query = search.trim().toLocaleLowerCase();
    const matchesSearch = !query || [lesson.titleEn, lesson.titleZh, lesson.descriptionEn, lesson.descriptionZh]
      .some((value) => value.toLocaleLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });
  const columns = [visible.filter((_, index) => index % 2 === 0), visible.filter((_, index) => index % 2 === 1)];
  return (
    <View style={styles.page}>
      <CommonHeader eyebrow={t('tryLesson')} title={t('allLessons')} description={t('allLessonsBody')} {...(!embedded ? { backAction: () => router.back() } : {})} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={lessons.isRefetching && !lessons.isFetchingNextPage} onRefresh={() => void lessons.refetch()} tintColor={theme.violetDeep} colors={[theme.violetDeep]} />} onScroll={({ nativeEvent }) => { const { layoutMeasurement, contentOffset, contentSize } = nativeEvent; if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 240 && lessons.hasNextPage && !lessons.isFetchingNextPage) void lessons.fetchNextPage(); }} scrollEventThrottle={200}>
        <View style={styles.search}><Search size={18} color={theme.inkSoft} /><TextInput value={search} onChangeText={setSearch} placeholder={language === 'zh' ? '搜索课程' : 'Search lessons'} placeholderTextColor={theme.inkSoft} style={styles.searchInput} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[{ id: 'all', name: t('all'), emoji: '' }, ...categories.map((c) => ({ id: c.id, name: language === 'zh' ? c.nameZh : c.nameEn, emoji: c.emoji }))].map((category) => (
            <AnimatedPressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.filter, categoryId === category.id && styles.filterActive]}>
              <Text style={[styles.filterText, categoryId === category.id && styles.filterTextActive]}>{category.emoji ? `${category.emoji} ` : ''}{category.name}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
        <View style={styles.grid}>
          {columns.map((column, columnIndex) => <View key={columnIndex} style={styles.gridColumn}>
          {column.map((lesson) => {
            const title = language === 'zh' ? lesson.titleZh : lesson.titleEn;
            const description = language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn;
            return <AnimatedPressable key={lesson.id} onPress={() => openLesson(router, lesson, language)} style={styles.card}>
              <View style={styles.cardTop}><View style={[styles.emojiWrap, lesson.techniqueKey === 'palace' && styles.emojiWrapPalace]}><Text style={styles.emoji}>{lesson.emoji}</Text></View><View style={styles.badge}><Text style={styles.badgeText}>{lesson.techniqueKey === 'palace' ? t('palace') : t('numberPeg')}</Text></View></View>
              <Text style={styles.title}>{title}</Text><Text numberOfLines={2} style={styles.description}>{description}</Text>
              <View style={styles.meta}><Text style={styles.metaText}>{lesson.items.length} {lesson.items.length === 1 ? t('item') : t('items')}</Text></View>
            </AnimatedPressable>;
          })}
          </View>)}
        </View>
        {lessons.isFetchingNextPage ? <Text style={styles.loadingMore}>{language === 'zh' ? '正在载入更多课程…' : 'Loading more lessons…'}</Text> : null}
      </ScrollView>
    </View>
  );
}

function openLesson(router: ReturnType<typeof useRouter>, lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  const title = language === 'zh' ? lesson.titleZh : lesson.titleEn;
  const items = lesson.items.map((item) => language === 'zh' ? item.contentZh : item.contentEn);
  const path = lesson.techniqueKey === 'palace' ? '/palaces/create-memory' : '/number-peg/build';
  router.push(`${path}?title=${encodeURIComponent(title)}&goalType=${lesson.goalType}&items=${encodeURIComponent(JSON.stringify(items))}` as Href);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' }, content: { padding: 16, paddingBottom: 36 },
  search: { height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 }, filters: { gap: 8, paddingVertical: 16 },
  filter: { borderRadius: 999, borderWidth: 1.5, borderColor: theme.line, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' }, filterActive: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep }, filterText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 11 }, filterTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, gridColumn: { flex: 1, gap: 12 }, card: { width: '100%', minHeight: 178, borderRadius: 18, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 13, shadowColor: theme.violetDeep, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, emojiWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.berryTint }, emojiWrapPalace: { backgroundColor: theme.violetTint }, emoji: { fontSize: 27 }, badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: theme.skyTint }, badgeText: { color: theme.sky, fontFamily: typography.bodyExtraBold, fontSize: 9 }, title: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 14, marginTop: 11 }, description: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, lineHeight: 16, marginTop: 5 }, meta: { marginTop: 16, gap: 8 }, metaText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10 }, loadingMore: { textAlign: 'center', color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11, paddingVertical: 18 },
});
