import AnimatedPressable from '@/components/AnimatedPressable';
import { type ReactNode, useCallback, useState } from 'react';
import { FlatList, Keyboard, RefreshControl, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Href, Redirect, useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthProvider';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { LearningHeader } from '../components/LearningHeader';
import { LearningIconButton } from '../components/LearningIconButton';
import { LearningButton, LearningSkeleton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { LearningChoiceMenu } from '../components/LearningChoiceMenu';
import { LearningWorkspaceActions } from '../components/LearningWorkspaceActions';
import { LearningLibraryCard } from '../components/LearningLibraryCard';
import { usePersonalLibraryStyles } from '../components/personalStudyLibraryStyles';
import { usePersonalStudyCourses, useRemoveLearningLibraryItem } from '../hooks/usePersonalStudy';
import { useEducationSavedCourses } from '../hooks/useEducationPracticeItems';
import { learningResumeRoute } from '../utils/learningActivity';
import { filterStudyLibrary, studyLibraryItems, type StudyLibraryFilter, type StudyLibraryItem } from '../utils/educationStudyLibrary';

export default function EducationPersonalCoursesScreen({ initialFilter = 'all', tabEntry = false, workspaceNavigation }: { initialFilter?: StudyLibraryFilter; tabEntry?: boolean; workspaceNavigation?: ReactNode }) {
  const { styles: common } = useLearningStyles(); const { styles: s, theme } = usePersonalLibraryStyles();
  const { zh } = useLearningCopy(); const router = useRouter(); const { user } = useAuth();
  const profile = useCurrentUser(); const personal = usePersonalStudyCourses(); const saved = useEducationSavedCourses();
  const remove = useRemoveLearningLibraryItem();
  const [pendingRemoval, setPendingRemoval] = useState<StudyLibraryItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { width: windowWidth } = useWindowDimensions();
  const [listWidth, setListWidth] = useState(windowWidth);
  const grid = viewMode === 'grid';
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState<StudyLibraryFilter>(initialFilter);
  const { refetch: refetchPersonal } = personal; const { refetch: refetchSaved } = saved;
  const refresh = useCallback(() => { void refetchPersonal(); void refetchSaved(); }, [refetchPersonal, refetchSaved]);
  useFocusEffect(useCallback(() => { if (user?.id && user.accountMode !== 'RestrictedLearner') refresh(); }, [refresh, user?.id, user?.accountMode]));
  const items = studyLibraryItems(personal.data ?? [], saved.data ?? []);
  const filtered = filterStudyLibrary(items, filter, search);
  const drafts = (personal.data ?? []).filter(item => !item.readyToLearn).length;
  const loading = filter === 'saved' ? saved.isLoading : filter === 'all' ? personal.isLoading || saved.isLoading : personal.isLoading;
  const filteredView = !!search.trim() || filter !== 'all';
  const create = () => { Keyboard.dismiss(); router.push('/education/create-course' as Href); };
  const askRemove = (item: StudyLibraryItem) => { Keyboard.dismiss(); remove.reset(); setPendingRemoval(item); };
  const confirmRemove = async () => {
    if (!pendingRemoval || remove.isPending) return;
    try { await remove.mutateAsync({ id: pendingRemoval.course.id, source: pendingRemoval.source }); setPendingRemoval(null); }
    catch { /* Keep the confirmation open with a safe, retryable error message. */ }
  };
  const personalRemoval = pendingRemoval?.source === 'personal';
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;
  return <View style={common.page}>
    <LearningHeader hideBackButton={tabEntry} additionalContent={workspaceNavigation} showAiCredits={false} title={tabEntry ? (zh ? '学习' : 'Learn') : (zh ? '我的学习资料' : 'My learning library')} actions={[{ component: <LearningWorkspaceActions /> }]} />
    <FlatList key={viewMode} numColumns={grid ? 2 : 1} columnWrapperStyle={grid ? s.gridColumns : undefined} onLayout={event => setListWidth(event.nativeEvent.layout.width)} data={filtered} keyExtractor={item => `${item.source}-${item.course.id}`} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl tintColor={theme.violetDeep} colors={[theme.violetDeep]} refreshing={personal.isRefetching || saved.isRefetching} onRefresh={refresh} />}
      ListHeaderComponent={<View style={{ gap: 16, marginBottom: 2 }}>
        <AnimatedPressable accessibilityRole="button" accessibilityLabel={zh ? '浏览课程' : 'Browse courses'} onPress={() => { Keyboard.dismiss(); router.push('/discover'); }} style={[s.row, { minHeight: 64, padding: 14, borderRadius: 18, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.line }]}>
          <Ionicons name="compass-outline" size={25} color={theme.violetDeep} />
          <View style={{ flex: 1, gap: 3 }}><Text style={s.sectionTitle}>{zh ? '浏览课程' : 'Browse courses'}</Text><Text style={s.small}>{zh ? '找到想学的，收藏到这里' : 'Find something new and save it here'}</Text></View>
          <Ionicons name="arrow-forward" size={20} color={theme.violetDeep} />
        </AnimatedPressable>
        {tabEntry ? <AnimatedPressable accessibilityRole="button" onPress={() => router.push('/education/assignments')} style={[s.row, { minHeight: 52, paddingHorizontal: 12, borderRadius: 14, backgroundColor: theme.paper, borderWidth: 1, borderColor: theme.line }]}><Ionicons name="checkbox-outline" size={22} color={theme.successText} /><Text style={[s.small, { flex: 1, color: theme.successText }]}>{zh ? '我的学习任务' : 'My assignments'}</Text><Ionicons name="chevron-forward" size={18} color={theme.successText} /></AnimatedPressable> : null}
        {!tabEntry ? <View style={s.hero}>
          <View style={s.heroCopy}>
            <View style={s.heroBadge}><Ionicons name="library-outline" size={12} color={theme.heroInk} /><Text style={s.heroBadgeText}>{zh ? '我的学习书架' : 'YOUR LEARNING SHELF'}</Text></View>
            <Text style={s.heroTitle}>{zh ? '想学的，收藏的，\n都在这里' : 'Your own creations.\nYour favourite finds.'}</Text>
            <Text style={s.heroMeta}>{zh ? `我创建 ${personal.data?.length ?? '…'} · 已收藏 ${saved.data?.length ?? '…'}` : `${personal.data?.length ?? '…'} created · ${saved.data?.length ?? '…'} saved`}</Text>
          </View>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><CompanionActor stage={profile.user?.level ?? 1} size={94} cue={{ action: 'hello', sequence: 0 }} /></View>
        </View> : null}
        <View style={s.search}><Ionicons name="search-outline" size={21} color={theme.inkSoft} />
          <TextInput accessibilityLabel={zh ? '搜索学习资料名称' : 'Search learning material titles'} placeholder={zh ? '搜索学习资料' : 'Search your library'} value={search} onChangeText={setSearch}
            placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={s.searchInput} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} />
          {search ? <LearningIconButton icon="close-circle-outline" variant="plain" label={zh ? '清除搜索' : 'Clear search'} onPress={() => setSearch('')} /> : <View style={{ width: 8 }} />}
        </View>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <LearningChoiceMenu value={filter} onChange={value => setFilter(value as StudyLibraryFilter)} title={zh ? '筛选学习资料' : 'Filter study materials'} options={[
            { value: 'all', label: zh ? '全部资料' : 'All materials', count: personal.data && saved.data ? items.length : '…' },
            { value: 'personal', label: zh ? '我创建的' : 'Created by me', count: personal.data?.length ?? '…' },
            { value: 'saved', label: zh ? '已收藏' : 'Saved', count: saved.data?.length ?? '…' },
            { value: 'draft', label: zh ? '草稿' : 'Drafts', count: personal.data ? drafts : '…' },
          ]} />
          <Text style={[s.small, { flex: 1 }]}>{zh ? `${filtered.length} 份` : `${filtered.length} items`}</Text>
          <LearningIconButton icon={grid ? 'list-outline' : 'grid-outline'} label={grid ? (zh ? '切换列表模式' : 'Switch to list view') : (zh ? '切换双列卡片模式' : 'Switch to two-column cards')} variant="plain"
            onPress={() => { Keyboard.dismiss(); setViewMode(grid ? 'list' : 'grid'); }} />
        </View>
        {([{ query: personal, label: zh ? '自己创建的内容' : 'Your creations' }, { query: saved, label: zh ? '收藏资料' : 'Saved materials' }]).map(({ query, label }) => query.isError ?
          <View key={label} style={s.card}><Text accessibilityRole="alert" style={s.small}>{zh ? `${label}暂时无法更新，请重试。` : `Could not refresh ${label.toLowerCase()}. Please retry.`}</Text><LearningButton secondary label={zh ? '重试' : 'Retry'} onPress={() => void query.refetch()} /></View> : null)}
      </View>}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      renderItem={({ item }) => <View style={{ width: grid ? Math.max(1, (listWidth - 44) / 2) : '100%' }}>
        <LearningLibraryCard item={item} grid={grid} onRemove={() => askRemove(item)} onStart={() => {
          Keyboard.dismiss();
          router.push((item.source === 'personal' && !item.course.readyToLearn ? `/education/create-course?draftId=${encodeURIComponent(item.course.id)}` : learningResumeRoute({ source: item.source === 'personal' ? 'personal' : 'public', courseId: item.course.id })) as Href);
        }} onPress={() => {
          Keyboard.dismiss();
          router.push((item.source === 'saved' ? `/community/education/${item.course.id}` : item.course.readyToLearn ? `/education/my-courses/${item.course.id}` : `/education/create-course?draftId=${item.course.id}`) as Href);
        }} />
      </View>}
      ListFooterComponent={loading && filtered.length ? <LearningSkeleton /> : null}
      ListEmptyComponent={loading ? <LearningSkeleton /> : personal.isError || saved.isError ? null : <View style={s.state}>
        <View style={s.stateIcon}><Ionicons name={filteredView ? 'search-outline' : 'library-outline'} size={30} color={theme.violetDeep} /></View>
        <Text style={s.sectionTitle}>{search.trim() ? (zh ? '没有找到这份资料' : 'No matching materials') : filter === 'saved' ? (zh ? '喜欢的课程，收藏在这里' : 'Keep favourite courses here') : filter === 'draft' ? (zh ? '还没有未完成的草稿' : 'No unfinished drafts') : (zh ? '放入第一份学习内容' : 'Add your first study set')}</Text>
        <Text style={[s.small, { textAlign: 'center' }]}>{filter === 'saved' && !search.trim() ? (zh ? '到课程页面点一下书签，下次就能在这里找到。' : 'Tap a course’s bookmark to find it here next time.') : (zh ? '自己创建的内容和收藏的课程，都能在这里找到。' : 'Your creations and saved courses share one shelf.')}</Text>
        <LearningButton label={filter === 'saved' && !search.trim() ? (zh ? '探索课程' : 'Explore courses') : filteredView ? (zh ? '查看全部资料' : 'View all materials') : (zh ? '添加学习内容' : 'Add study content')}
          onPress={filter === 'saved' && !search.trim() ? () => router.navigate('/discover' as Href) : filteredView ? () => { setFilter('all'); setSearch(''); Keyboard.dismiss(); } : create} />
      </View>}
    />
    <ConfirmModal visible={!!pendingRemoval} destructive subject={pendingRemoval?.course.title} isLoading={remove.isPending}
      title={personalRemoval ? (zh ? '删除这份学习内容？' : 'Delete this study content?') : (zh ? '取消收藏这门课程？' : 'Remove this saved course?')}
      description={personalRemoval ? (zh ? '将从你的资料库移除，无法在应用内恢复。' : 'It will leave your library and cannot be restored in the app.') : (zh ? '只会从你的收藏移除，课程和学习记录仍会保留。' : 'Only the bookmark is removed. The course and your learning records remain.')}
      confirmText={personalRemoval ? (zh ? '删除' : 'Delete') : (zh ? '取消收藏' : 'Remove bookmark')} cancelText={zh ? '保留' : 'Keep'}
      onConfirm={() => void confirmRemove()} onCancel={() => { if (!remove.isPending) setPendingRemoval(null); }}>
      {remove.isError ? <Text accessibilityRole="alert" style={[s.small, { color: theme.berryDeep }]}>{zh ? '操作失败，资料仍保留。请检查网络后重试。' : 'Could not remove this item. It is still in your library. Check your connection and retry.'}</Text> : null}
    </ConfirmModal>
  </View>;
}
