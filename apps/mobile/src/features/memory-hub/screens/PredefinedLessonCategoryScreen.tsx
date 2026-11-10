import { CommonHeader } from '@/components/CommonHeader';
import { MemoryLearningCard } from '@/components/MemoryLearningCard';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { AppButton } from '@/components/ui/AppButton';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';
import { useTranslation } from '@/core/i18n/useTranslation';
import { usePredefinedMemoryLessons, type PredefinedMemoryLesson } from '@/features/predefined-memory-lessons';
import { createThemedStyles } from '@/theme/createThemedStyles';
import { typography } from '@/theme/typography';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCcw, Search, Sparkles } from '@/core/icons';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemoryCollections, useDownloadMemoryCollection } from '@/features/predefined-memory-lessons/hooks/useMemoryCollections';
import Toast from 'react-native-toast-message';
import { predefinedLessonRoute } from '@/features/predefined-memory-lessons/utils/predefinedLessonRoute';

export default function PredefinedLessonCategoryScreen() {
  const { styles, theme } = useStyles();
  const router = useRouter();
  const { categoryId, collection: collectionParam } = useLocalSearchParams<{ categoryId?: string; collection?: string }>();
  const { language, t } = useTranslation('practice');
  const { isOffline, canShowRequestErrors } = useNetworkStatus();
  const lessonsQuery = usePredefinedMemoryLessons();
  const collectionsQuery = useMemoryCollections();
  const download = useDownloadMemoryCollection();
  const collection = collectionsQuery.data?.find((item) => item.id === categoryId);
  const [search, setSearch] = useState('');

  const categoryLessons = useMemo(
    () => collectionParam === '1' ? collection?.lessons ?? [] : (lessonsQuery.data ?? [])
      .filter((lesson) => lesson.categoryId === categoryId)
      .sort((left, right) => left.sortOrder - right.sortOrder),
    [categoryId, lessonsQuery.data, collectionParam, collection],
  );
  const category = collectionParam === '1' ? collection && { nameZh: collection.titleZh, nameEn: collection.titleEn,
    descriptionZh: collection.descriptionZh, descriptionEn: collection.descriptionEn, emoji: collection.emoji } : categoryLessons[0]?.category;
  const activeQuery = collectionParam === '1' ? collectionsQuery : lessonsQuery;
  const visibleLessons = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return categoryLessons;
    return categoryLessons.filter((lesson) => [
      lesson.titleEn,
      lesson.titleZh,
      lesson.descriptionEn,
      lesson.descriptionZh,
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [categoryLessons, search]);
  const columns = [
    visibleLessons.filter((_, index) => index % 2 === 0),
    visibleLessons.filter((_, index) => index % 2 === 1),
  ];

  const title = category
    ? (language === 'zh' ? category.nameZh : category.nameEn)
    : t('allLessons');
  const description = category
    ? (language === 'zh' ? category.descriptionZh : category.descriptionEn)
    : t('allLessonsBody');
  const itemCount = categoryLessons.reduce((total, lesson) => total + lesson.items.length, 0);

  return (
    <View style={styles.page}>
      <CommonHeader eyebrow={t('courseCollection')} title={title} description={description}
        backAction={() => router.canGoBack() ? router.back() : router.replace('/lessons' as Href)} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={activeQuery.isRefetching}
            onRefresh={() => void activeQuery.refetch()}
            tintColor={theme.violetDeep}
            colors={[theme.violetDeep]}
          />
        )}>
        {category ? (
          <View style={styles.collectionHero}>
            <View style={styles.heroArtwork}>
              <View style={styles.heroSparkle}><Sparkles size={16} color={theme.berryDeep} /></View>
              <Text style={styles.heroEmoji}>{category.emoji}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>{t('insideCollection')}</Text>
              <Text style={styles.heroCount}>
                {categoryLessons.length} {categoryLessons.length === 1 ? t('course') : t('courses')} · {itemCount} {t('items')}
              </Text>
            </View>
          </View>
        ) : null}

        {collectionParam === '1' && collection ? <AppButton
          label={download.isPending ? (language === 'zh' ? '正在加入…' : 'Adding…') : (language === 'zh' ? '加入我的记忆库' : 'Add to my library')}
          variant="primary"
          loading={download.isPending}
          disabled={isOffline}
          fullWidth
          onPress={() => download.mutate({ id: collection.id, language }, {
            onSuccess: (result) => router.push(`/memory-folders/${result.folderId}` as Href),
            onError: () => { if (canShowRequestErrors) Toast.show({ type: 'error', text1: language === 'zh' ? '合集下载失败，请重试' : 'Could not download collection. Try again.' }); },
          })}
          style={styles.downloadButton}
        /> : null}

        <View style={styles.search}>
          <Search size={18} color={theme.inkSoft} />
          <TextInput
            accessibilityLabel={t('searchCourses')}
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchCourses')}
            placeholderTextColor={theme.inkSoft}
            style={styles.searchInput}
          />
        </View>

        {!isOffline && activeQuery.isLoading ? (
          <View style={styles.stateCard}><Text style={styles.stateText}>{t('loadingLessons')}</Text></View>
        ) : canShowRequestErrors && activeQuery.isError ? (
          <ModuleNoticeCard
            icon={<RefreshCcw size={22} color={theme.inkSoft} />}
            title={t('lessonsUnavailable')}
            body={t('lessonsUnavailableBody')}
            actionLabel={t('tryAgain')}
            onAction={() => activeQuery.refetch()}
          />
        ) : isOffline && !activeQuery.data ? null : visibleLessons.length ? (
          <View style={styles.grid}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={styles.gridColumn}>
                {column.map((lesson) => {
                  const localized = localizeLesson(lesson, language);
                  return (
                    <MemoryLearningCard
                      key={lesson.id}
                      techniqueKey={lesson.techniqueKey}
                      title={localized.title}
                      description={localized.description}
                      metadata={`${lesson.items.length} ${t('items')}`}
                      artwork={<Text style={styles.lessonEmoji}>{lesson.emoji}</Text>}
                      accessibilityLabel={`${localized.title}, ${lesson.techniqueKey === 'palace' ? t('palace') : t('numberPeg')}`}
                      onPress={() => openLesson(router, lesson, language)}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}><Text style={styles.stateText}>{t('noLessons')}</Text></View>
        )}
      </ScrollView>
    </View>
  );
}

function localizeLesson(lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  return {
    title: language === 'zh' ? lesson.titleZh : lesson.titleEn,
    description: language === 'zh' ? lesson.descriptionZh : lesson.descriptionEn,
    items: lesson.items
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((item) => language === 'zh' ? item.contentZh : item.contentEn),
  };
}

function openLesson(router: ReturnType<typeof useRouter>, lesson: PredefinedMemoryLesson, language: 'en' | 'zh') {
  router.push(predefinedLessonRoute(lesson, language) as Href);
}

const useStyles = createThemedStyles((theme) => StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  downloadButton: { alignSelf: 'stretch' },
  content: { padding: 16, paddingBottom: 36, gap: 16 },
  collectionHero: { minHeight: 112, borderRadius: 26, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroArtwork: { width: 76, height: 76, borderRadius: 27, backgroundColor: theme.paper, borderWidth: 1.5, borderColor: theme.line, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-3deg' }] },
  heroSparkle: { position: 'absolute', right: -7, top: -7, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.berryTint, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 39 },
  heroCopy: { flex: 1 },
  heroLabel: { color: theme.violetDeep, fontFamily: typography.bodyExtraBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroCount: { color: theme.ink, fontFamily: typography.displayExtraBold, fontSize: 18, lineHeight: 24, marginTop: 5 },
  search: { height: 48, borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, color: theme.ink, fontFamily: typography.bodySemibold, fontSize: 14 },
  grid: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  gridColumn: { flex: 1, gap: 12 },
  lessonEmoji: { fontSize: 29 },
  stateCard: { minHeight: 120, borderRadius: 22, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.paper, alignItems: 'center', justifyContent: 'center', padding: 20 },
  stateText: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
}));
