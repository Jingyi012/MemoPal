import AnimatedPressable from '@/components/AnimatedPressable';
import { CommonHeader } from '@/components/CommonHeader';
import { MemoryLearningCard } from '@/components/MemoryLearningCard';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import {
  usePredefinedMemoryLessons,
} from '@/features/predefined-memory-lessons';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useRouter } from 'expo-router';
import { ChevronRight, RefreshCcw, Search, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemoryCollections } from '@/features/predefined-memory-lessons/hooks/useMemoryCollections';
import type { MemoryCollection } from '@/features/predefined-memory-lessons/api/memoryCollections.api';

type LessonCollection = MemoryCollection & {
  itemCount: number;
};

export default function PredefinedLessonsScreen({ embedded = false }: { embedded?: boolean }) {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { language, t } = useTranslation('practice');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const lessonsQuery = usePredefinedMemoryLessons();
  const collectionsQuery = useMemoryCollections();
  const [search, setSearch] = useState('');

  const collections = useMemo(() => {
    return (collectionsQuery.data ?? []).map((collection): LessonCollection => ({
      ...collection,
      itemCount: collection.lessons.reduce((count, lesson) => count + lesson.items.length, 0),
    }));
  }, [collectionsQuery.data]);
  const groupedLessonIds = new Set(collections.flatMap((collection) => collection.lessons.map((lesson) => lesson.id)));
  const standaloneLessons = (lessonsQuery.data ?? []).filter((lesson) => !groupedLessonIds.has(lesson.id) &&
    [lesson.titleEn, lesson.titleZh].some((title) => title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));

  const visibleCollections = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return collections;
    return collections.filter(({ titleEn, titleZh, descriptionEn, descriptionZh, lessons }) => [
      titleEn,
      titleZh,
      descriptionEn,
      descriptionZh,
      ...lessons.flatMap((lesson) => [lesson.titleEn, lesson.titleZh]),
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [collections, search]);

  const entries = [
    ...visibleCollections.map((collection) => ({ kind: 'collection' as const, collection })),
    ...standaloneLessons.map((lesson) => ({ kind: 'lesson' as const, lesson })),
  ];
  const columns = [
    entries.filter((_, index) => index % 2 === 0),
    entries.filter((_, index) => index % 2 === 1),
  ];

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow={t('tryLesson')}
        title={t('allLessons')}
        description={t('lessonCollectionsBody')}
        {...(!embedded ? { backAction: () => router.back() } : {})}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={lessonsQuery.isRefetching || collectionsQuery.isRefetching}
            onRefresh={() => void Promise.all([lessonsQuery.refetch(), collectionsQuery.refetch()])}
            tintColor={theme.violetDeep}
            colors={[theme.violetDeep]}
          />
        )}>
        <View style={styles.search}>
          <Search size={18} color={theme.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchCollections')}
            placeholderTextColor={theme.inkSoft}
            style={styles.searchInput}
          />
        </View>

        {!isOffline && (lessonsQuery.isLoading || collectionsQuery.isLoading) ? (
          <View style={styles.stateCard}><Text style={styles.stateText}>{t('loadingLessons')}</Text></View>
        ) : canShowRequestErrors && (lessonsQuery.isError || collectionsQuery.isError) ? (
          <ModuleNoticeCard
            icon={<RefreshCcw size={22} color={theme.inkSoft} />}
            title={t('lessonsUnavailable')}
            body={t('lessonsUnavailableBody')}
            actionLabel={t('tryAgain')}
            onAction={() => Promise.all([lessonsQuery.refetch(), collectionsQuery.refetch()])}
          />
        ) : isOffline && !lessonsQuery.data && !collectionsQuery.data ? null : entries.length ? (
          <View style={styles.grid}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={styles.gridColumn}>
                {column.map((entry, index) => {
                  if (entry.kind === 'lesson') {
                    const { lesson } = entry;
                    const title = language === 'zh' ? lesson.titleZh : lesson.titleEn;
                    return <MemoryLearningCard key={lesson.id}
                      techniqueKey={lesson.techniqueKey}
                      title={title}
                      description={language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn}
                      metadata={`${lesson.items.length} ${t('items')}`}
                      artwork={<Text style={styles.emoji}>{lesson.emoji}</Text>}
                      accessibilityLabel={`${title}, ${lesson.techniqueKey === 'palace' ? t('palace') : t('numberPeg')}`}
                      onPress={() => {
                        const path = lesson.techniqueKey === 'palace' ? '/palaces/create-memory' : '/number-peg/create';
                        router.push({ pathname: path, params: { title, emoji: lesson.emoji, goalType: lesson.goalType,
                          items: JSON.stringify(lesson.items.slice().sort((a, b) => a.position - b.position)
                            .map((item) => language === 'zh' ? item.contentZh : item.contentEn)) } } as Href);
                      }} />;
                  }
                  const { collection } = entry;
                  const name = language === 'zh' ? collection.titleZh : collection.titleEn;
                  const description = language === 'zh'
                    ? collection.descriptionZh
                    : collection.descriptionEn;
                  const tone = (index * 2 + columnIndex) % 4;
                  return (
                    <AnimatedPressable
                      lively
                      key={collection.id}
                      accessibilityLabel={`${name}, ${collection.lessons.length} ${collection.lessons.length === 1 ? t('course') : t('courses')}`}
                      accessibilityRole="button"
                      onPress={() => router.push(`/lessons/${collection.id}?collection=1` as Href)}
                      style={[
                        styles.collectionCard,
                        tone === 0 && styles.collectionCardViolet,
                        tone === 1 && styles.collectionCardBerry,
                        tone === 2 && styles.collectionCardSky,
                        tone === 3 && styles.collectionCardSun,
                      ]}>
                      <View style={styles.artworkRow}>
                        <View style={styles.emojiHalo}>
                          <Text style={styles.emoji}>{collection.emoji}</Text>
                        </View>
                        <View style={styles.enterButton}>
                          <ChevronRight size={18} color={theme.violetDeep} />
                        </View>
                      </View>
                      <Text style={styles.collectionTitle}>{name}</Text>
                      <Text numberOfLines={3} style={styles.collectionDescription}>{description}</Text>
                      <View style={styles.collectionMeta}>
                        <Sparkles size={13} color={theme.berryDeep} />
                        <Text style={styles.collectionMetaText}>
                          {collection.lessons.length} {collection.lessons.length === 1 ? t('course') : t('courses')} · {collection.itemCount} {t('items')}
                        </Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}><Text style={styles.stateText}>{t('noCollections')}</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  search: { height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  grid: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  gridColumn: { flex: 1, gap: 12 },
  collectionCard: { width: '100%', minHeight: 205, borderRadius: 26, borderWidth: 1.5, padding: 14, shadowColor: theme.violetDeep, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  collectionCardViolet: { backgroundColor: theme.violetTint, borderColor: theme.violetLine },
  collectionCardBerry: { backgroundColor: theme.berryTint, borderColor: theme.berryLine },
  collectionCardSky: { backgroundColor: theme.skyTint, borderColor: theme.skyLine },
  collectionCardSun: { backgroundColor: theme.sunTint, borderColor: theme.sunLine },
  lessonCard: { backgroundColor: theme.paper, borderColor: theme.line },
  artworkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emojiHalo: { width: 58, height: 58, borderRadius: 21, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }] },
  emoji: { fontSize: 31 },
  enterButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center' },
  collectionTitle: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 17, lineHeight: 22, marginTop: 15 },
  collectionDescription: { color: theme.inkSoft, fontFamily: typography.bodySemibold, fontSize: 11.5, lineHeight: 17, marginTop: 5 },
  collectionMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14 },
  collectionMetaText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 10 },
  stateCard: { minHeight: 120, borderRadius: 22, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center', padding: 20 },
  stateText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
}));
