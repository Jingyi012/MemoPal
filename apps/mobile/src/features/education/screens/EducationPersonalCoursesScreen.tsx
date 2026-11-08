import { useCallback, useState } from 'react';
import { FlatList, Keyboard, RefreshControl, Text, TextInput, View } from 'react-native';
import { Href, Redirect, useFocusEffect, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthProvider';
import AnimatedPressable from '@/components/AnimatedPressable';
import { CompanionActor } from '@/features/profile/companion/CompanionActor';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { LearningHeader } from '../components/LearningHeader';
import { LearningIconButton } from '../components/LearningIconButton';
import { LearningButton, LearningSkeleton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { PersonalStudyShelfCard } from '../components/PersonalStudyShelfCard';
import { usePersonalLibraryStyles } from '../components/personalStudyLibraryStyles';
import { usePersonalStudyCourses } from '../hooks/usePersonalStudy';

type ShelfFilter = 'all' | 'ready' | 'draft';
export default function EducationPersonalCoursesScreen() {
  const { styles: common } = useLearningStyles(); const { styles: s, theme } = usePersonalLibraryStyles();
  const { zh } = useLearningCopy(); const router = useRouter(); const { user } = useAuth();
  const profile = useCurrentUser(); const courses = usePersonalStudyCourses();
  const { refetch } = courses;
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState<ShelfFilter>('all');
  const items = courses.data ?? [];
  const ready = items.filter(item => item.readyToLearn).length;
  const cardCount = items.reduce((count, item) => count + item.studyItemCount, 0);
  const query = search.normalize('NFC').trim().toLocaleLowerCase();
  const filtered = items.filter(item => (!query || item.title.normalize('NFC').toLocaleLowerCase().includes(query)) &&
    (filter === 'all' || (filter === 'ready' ? item.readyToLearn : !item.readyToLearn)));
  const filteredView = !!query || filter !== 'all';
  const create = () => { Keyboard.dismiss(); router.push('/education/create-course' as Href); };
  useFocusEffect(useCallback(() => { if (user?.id && user.accountMode !== 'RestrictedLearner') void refetch(); }, [refetch, user?.id, user?.accountMode]));
  if (user?.accountMode === 'RestrictedLearner') return <Redirect href="/education/assignments" />;
  return <View style={common.page}>
    <LearningHeader showAiCredits={false} title={zh ? '我的学习内容' : 'My study content'} actions={[{ component: <LearningIconButton icon="add" label={zh ? '创建学习内容' : 'Create study content'} onPress={create} /> }]} />
    <FlatList data={filtered} keyExtractor={item => item.id} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl tintColor={theme.violetDeep} colors={[theme.violetDeep]} refreshing={courses.isRefetching} onRefresh={() => void courses.refetch()} />}
      ListHeaderComponent={<View style={{ gap: 16, marginBottom: 2 }}>
        <View style={s.hero}>
          <View style={s.heroCopy}>
            <View style={s.heroBadge}><Ionicons name="lock-closed-outline" size={12} color={theme.heroInk} /><Text style={s.heroBadgeText}>{zh ? '私人学习书架' : 'YOUR PRIVATE SHELF'}</Text></View>
            <Text style={s.heroTitle}>{zh ? '把想学的，\n慢慢学会' : 'Make room for\nsomething new'}</Text>
            <Text style={s.heroMeta}>{courses.data ? (zh ? `${items.length} 份内容 · ${cardCount} 张卡片` : `${items.length} sets · ${cardCount} cards`) : (zh ? '你的学习资料，都在这里' : 'A little space for your learning')}</Text>
          </View>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><CompanionActor stage={profile.user?.level ?? 1} size={94} cue={{ action: 'hello', sequence: 0 }} /></View>
        </View>
        <View style={s.search}>
          <Ionicons name="search-outline" size={21} color={theme.inkSoft} />
          <TextInput accessibilityLabel={zh ? '搜索学习内容名称' : 'Search study content names'} placeholder={zh ? '搜索学习内容' : 'Search your study content'} value={search} onChangeText={setSearch}
            placeholderTextColor={theme.inkSoft} selectionColor={theme.violetDeep} style={s.searchInput} returnKeyType="search" onSubmitEditing={Keyboard.dismiss} />
          {search ? <LearningIconButton icon="close-circle-outline" variant="plain" label={zh ? '清除搜索' : 'Clear search'} onPress={() => setSearch('')} /> : <View style={{ width: 8 }} />}
        </View>
        <View style={s.filters}>
          {([{ id: 'all', label: zh ? '全部' : 'All', count: items.length }, { id: 'ready', label: zh ? '可学习' : 'Ready', count: ready }, { id: 'draft', label: zh ? '草稿' : 'Drafts', count: items.length - ready }] as const).map(tab =>
            <AnimatedPressable key={tab.id} accessibilityRole="button" accessibilityState={{ selected: filter === tab.id }} onPress={() => setFilter(tab.id)} style={[s.filter, filter === tab.id && s.selectedFilter]}>
              <Text style={[s.filterText, filter === tab.id && s.selectedFilterText]}>{tab.label}</Text><Text style={[s.count, filter === tab.id && s.selectedCount]}>{courses.data ? tab.count : '…'}</Text>
            </AnimatedPressable>)}
        </View>
        <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={s.sectionTitle}>{filter === 'draft' ? (zh ? '留着下次继续' : 'Pick up your drafts') : (zh ? '我的书架' : 'On your shelf')}</Text>{courses.data ? <Text style={s.small}>{zh ? `${filtered.length} 份内容` : `${filtered.length} sets`}</Text> : null}</View>
        {courses.isError && items.length > 0 ? <View style={s.card}><Text accessibilityRole="alert" style={s.small}>{zh ? '更新失败，已保留上次加载的内容。' : 'Could not refresh. Your last loaded content is still here.'}</Text><LearningButton secondary label={zh ? '重试' : 'Retry'} onPress={() => void courses.refetch()} /></View> : null}
      </View>}
      ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
      renderItem={({ item }) => <PersonalStudyShelfCard course={item} onPress={() => { Keyboard.dismiss(); router.push((item.readyToLearn ? `/education/my-courses/${item.id}` : `/education/create-course?draftId=${item.id}`) as Href); }} />}
      ListEmptyComponent={courses.isLoading ? <LearningSkeleton /> : courses.isError && !courses.data ? <View style={s.state}><Text accessibilityRole="alert" style={s.sectionTitle}>{zh ? '书架暂时没加载出来' : 'Your shelf could not load'}</Text><LearningButton secondary label={zh ? '重新加载' : 'Try again'} onPress={() => void courses.refetch()} /></View>
        : <View style={s.state}>
          <View style={s.stateIcon}><Ionicons name={filteredView ? 'search-outline' : 'book-outline'} size={30} color={theme.violetDeep} /></View>
          <Text style={s.sectionTitle}>{query ? (zh ? '没有找到这份内容' : 'No matching content') : filter === 'draft' ? (zh ? '还没有未完成的草稿' : 'No unfinished drafts') : filter === 'ready' ? (zh ? '内容准备好后，就能在这里学' : 'Your ready content will appear here') : (zh ? '放入第一份学习内容' : 'Add your first study set')}</Text>
          <Text style={[s.small, { textAlign: 'center' }]}>{filteredView ? (zh ? '换个关键词，或看看全部内容。' : 'Try another search or view all content.') : (zh ? '把词表或听写内容加进来，和沫沫一起学。' : 'Bring a word list and learn with Momo.')}</Text>
          <LearningButton label={filteredView ? (zh ? '查看全部内容' : 'View all content') : (zh ? '添加学习内容' : 'Add study content')} onPress={filteredView ? () => { setFilter('all'); setSearch(''); Keyboard.dismiss(); } : create} />
        </View>}
    />
  </View>;
}
