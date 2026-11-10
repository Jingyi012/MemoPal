import { useState } from 'react';
import { AppBottomSheet } from '@/components/AppBottomSheet';
import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { StudyLibraryItem } from '../utils/educationStudyLibrary';
import { useEducationGuidedCourseProgress } from '../hooks/useEducationPracticeItems';
import { useLearningActivity } from '../hooks/useLearningActivity';
import { LearningProgress, learningThemeFor, useLearningCopy } from './LearningUi';
import { LearningIconButton } from './LearningIconButton';
import { usePersonalLibraryStyles } from './personalStudyLibraryStyles';

type CardProps = { item: StudyLibraryItem; grid: boolean; onPress: () => void; onRemove: () => void; onStart?: () => void };
type ContentProps = Omit<CardProps, 'item' | 'onRemove'> & {
  onRemove?: () => void; onLongPress?: () => void; accessibilityLabel?: string; accessibilityHint?: string; description?: string;
  title: string; source: string; metadata: string; mark: string; draft?: boolean;
  status?: string; complete?: boolean; action: string; removeLabel: string;
  progress?: { solved: number; total: number };
  coverArtwork?: ReactNode; menuIcon?: 'trash-outline' | 'ellipsis-horizontal'; coverIcon?: 'book-outline' | 'business-outline' | 'keypad-outline';
};

export function LearningLibraryCard(props: CardProps) {
  const { zh } = useLearningCopy();
  const activity = useLearningActivity();
  if (props.item.source === 'saved') return <SavedLibraryCard {...props} item={props.item} />;
  const course = props.item.course;
  const draft = !course.readyToLearn;
  const started = activity.data?.some(item => item.source === 'personal' && item.courseId === course.id);
  const language = course.languageCode?.startsWith('zh') ? (zh ? '中文' : 'Chinese')
    : course.languageCode?.startsWith('en') ? 'English' : course.languageCode === 'ms' ? 'Bahasa Melayu' : course.languageCode;
  const mark = course.languageCode?.startsWith('zh') ? '字' : course.languageCode?.startsWith('en') ? 'Aa' : course.languageCode === 'ms' ? 'BM' : '＋';
  return <LearningLibraryCardSurface {...props} title={course.title} source={zh ? '我创建的' : 'Created by me'}
    metadata={`${course.studyItemCount} ${zh ? '张卡片' : 'cards'}${language ? ` · ${language}` : ''}`} mark={mark} draft={draft}
    status={draft ? (zh ? '草稿' : 'Draft') : (zh ? '可以开始学' : 'Ready to learn')} complete={!draft}
    action={draft ? (zh ? '继续编辑' : 'Continue editing') : started ? (zh ? '继续学习' : 'Continue learning') : (zh ? '开始学习' : 'Start learning')}
    removeLabel={`${zh ? '删除' : 'Delete'} ${course.title}`} />;
}

function SavedLibraryCard(props: CardProps & { item: Extract<StudyLibraryItem, { source: 'saved' }> }) {
  const ui = useLearningCopy(); const { theme } = usePersonalLibraryStyles();
  const course = props.item.course; const progress = useEducationGuidedCourseProgress(course.id);
  const lessons = progress.data?.lessons;
  const completed = !!lessons?.length && lessons.every(lesson => lesson.isComplete);
  const started = lessons?.some(lesson => lesson.isStarted);
  const subject = learningThemeFor(course.title, theme, course.subjectCode);
  const status = progress.isLoading ? (ui.zh ? '读取进度中' : 'Loading progress') : progress.isError ? (ui.zh ? '进度暂不可用' : 'Progress unavailable')
    : completed ? ui.done : started ? ui.underway : ui.notStarted;
  return <LearningLibraryCardSurface {...props} title={course.title} source={`${ui.zh ? '已收藏' : 'Saved'} · ${course.authorDisplayName}`}
    metadata={`${course.questionCount} ${ui.zh ? '题' : 'questions'} · ${course.assessmentCount} ${ui.zh ? '个练习' : 'practices'}`}
    mark={subject.key === 'other' ? (ui.zh ? '课' : 'Learn') : ui[subject.key]} status={status} complete={completed}
    progress={progress.isSuccess ? { solved: lessons?.reduce((n, lesson) => n + lesson.questionsSolved, 0) ?? 0, total: lessons?.reduce((n, lesson) => n + lesson.questionCount, 0) ?? course.questionCount } : undefined}
    action={completed ? (ui.zh ? '再次练习' : 'Practise again') : started ? (ui.zh ? '继续学习' : 'Continue learning') : (ui.zh ? '探索课程' : 'Explore course')}
    removeLabel={`${ui.zh ? '取消收藏' : 'Remove saved course'} ${course.title}`} />;
}

export function LearningLibraryCardSurface({ grid, title, source, metadata, mark, draft, status, complete, progress, action, removeLabel, onPress, onRemove, onStart, onLongPress, accessibilityLabel, accessibilityHint, description, coverArtwork, menuIcon = 'trash-outline', coverIcon = 'book-outline' }: ContentProps) {
  const { styles: s, theme } = usePersonalLibraryStyles();
  const [menuOpen, setMenuOpen] = useState(false);
  const { zh } = useLearningCopy();
  const openActions = () => menuIcon === 'ellipsis-horizontal' ? onRemove?.() : setMenuOpen(true);
  const statusColor = complete ? theme.successText : draft ? theme.violetDeep : theme.inkSoft;
  return <View style={s.libraryCardContainer}>
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityHint={accessibilityHint ?? (onRemove ? (zh ? '长按管理资料' : 'Hold to manage material') : undefined)} delayLongPress={400} onLongPress={onLongPress ?? (onRemove ? openActions : undefined)} onPress={onPress} style={[s.card, s.libraryCard, grid && s.gridCard]}>
      <View style={[s.cardMain, s.libraryMain, grid ? s.gridMain : s.listMain]}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.cover, draft && s.coverDraft, grid && s.gridCover, !!coverArtwork && { padding: 0, overflow: 'hidden' }]}>
          {coverArtwork ?? <><Ionicons name={draft ? 'create-outline' : coverIcon} size={23} color={draft || grid ? theme.violetDeep : theme.onAccent} />
          <Text numberOfLines={1} style={[s.coverLanguage, (draft || grid) && s.coverDraftLanguage]}>{mark}</Text></>}
        </View>
        <View style={[s.libraryCopy, grid && s.gridCopy]}>
          <Text numberOfLines={3} style={[s.title, grid && s.gridTitle]}>{title}</Text>
          {description ? <Text numberOfLines={3} style={s.small}>{description}</Text> : null}
          {source ? <Text numberOfLines={2} style={[s.small, grid && s.gridSource]}>{source}</Text> : null}
          <Text style={[s.small, grid && s.gridMetadata]}>{metadata}</Text>
        </View>
      </View>
      {status || progress ? <View style={[s.cardFooter, grid && s.gridFooter]}>
        <View style={s.libraryProgress}>
          {status ? <View style={[s.status, !complete && s.draftStatus, s.libraryStatus]}>
            <Ionicons name={draft ? 'pencil-outline' : complete ? 'checkmark-circle-outline' : 'ellipse-outline'} size={13} color={statusColor} />
            <Text style={[s.statusText, { color: statusColor, flexShrink: 1 }]}>{status}</Text>
          </View> : null}
          {progress ? <View style={s.libraryProgress}><Text style={s.small}>{progress.solved}/{progress.total}</Text><LearningProgress value={progress.solved} total={progress.total} height={6} /></View> : null}
        </View>

      </View> : null}
    </AnimatedPressable>
    {onRemove ? <View style={s.libraryRemove}><LearningIconButton variant="plain" icon="ellipsis-horizontal" label={`${zh ? '管理' : 'Manage'} ${title}`} onPress={openActions} /></View> : null}
    <AppBottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)}>
      <Text style={s.title}>{title}</Text>
      {onStart ? <AnimatedPressable accessibilityRole="button" onPress={() => { setMenuOpen(false); onStart(); }} style={[s.row, { minHeight: 48 }]}><Ionicons name={draft ? 'create-outline' : 'play-outline'} size={21} color={theme.violetDeep} /><Text style={s.action}>{action}</Text></AnimatedPressable> : null}
      <AnimatedPressable accessibilityRole="button" onPress={() => { setMenuOpen(false); onRemove?.(); }} style={[s.row, { minHeight: 48 }]}><Ionicons name="trash-outline" size={21} color={theme.berryDeep} /><Text style={[s.small, { color: theme.berryDeep }]}>{removeLabel}</Text></AnimatedPressable>
    </AppBottomSheet>
  </View>;
}
