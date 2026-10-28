import { LearningResultHero } from './LearningResultHero';
import { LearningMemoryCard } from './LearningMemoryCard';
import { useCurrentUser } from '@/features/profile/hooks/useCurrentUser';
import { useEducationCopy } from '../i18n';
import type { EducationGuidedLearningSession } from '../types/educationPractice.types';
import { createEducationGuidedPlaylist } from '../utils/educationGuidedLearningFlow';
import { useEducationPublicCourse } from '../hooks/useEducationPracticeItems';
import { LearningButton, useLearningCopy, useLearningStyles } from './LearningUi';
import { Href, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = Readonly<{ session: EducationGuidedLearningSession; classroomId?: string; onExit: () => void; onPractice: (ids: readonly string[]) => void; disabled: boolean; loading: boolean; onRetry: () => void }>;
export function EducationGuidedLearningSummary({ session, classroomId, onExit, onPractice, disabled, loading, onRetry }: Props) {
  const copy = useEducationCopy(); const ui = useLearningCopy(); const { styles: s, theme } = useLearningStyles();
  const profile = useCurrentUser(); const course = useEducationPublicCourse(classroomId ? '' : session.courseId); const router = useRouter(); const insets = useSafeAreaInsets();
  const firstTry = session.questions.filter(item => item.progress.firstTryCorrect === true).length;
  const solved = session.questions.filter(item => item.progress.solved).length;
  const missed = session.questions.filter(item => item.progress.missed);
  const missedIds = missed.map(item => item.question.id);
  const titles = [...new Set(missed.map(item => item.question.objectiveTitle).filter(Boolean))];
  const objectiveIds = new Set(missed.map(item => item.question.objectiveId));
  const memory = course.data?.objectives.find(item => objectiveIds.has(item.id) && item.recommendedMemorySet)?.recommendedMemorySet;
  const unanswered = session.questions.filter(item => item.progress.attemptCount === 0).map(item => item.question.id);
  const continueIds = createEducationGuidedPlaylist(unanswered, session.nextQuestionId);
  const stars = session.isComplete ? Math.max(1, Math.round(firstTry / Math.max(1, session.questions.length) * 3)) : 0;
  return <View style={s.page}>
    <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}>
      <LearningResultHero title={session.isComplete ? ui.celebrate : copy.guidedLessonIncomplete} subtitle={`${session.courseTitle} · ${session.assessmentTitle}`} stars={stars} />
      <View style={s.resultStats}>
        <View style={s.resultStat}><Text style={s.resultNumber}>{solved}/{session.questions.length}</Text><Text style={s.resultLabel}>{ui.zh ? '答对' : 'Solved'}</Text></View>
        <View style={s.resultStat}><Text style={s.resultNumber}>{profile.user?.totalXp ?? '—'}</Text><Text style={s.resultLabel}>{ui.zh ? '累计 XP' : 'Total XP'}</Text></View>
        <View style={s.resultStat}><Text style={s.resultNumber}>{titles.length}</Text><Text style={s.resultLabel}>{ui.reinforce}</Text></View>
      </View>
      <Text style={[s.small, { textAlign: 'center' }]}>{ui.firstTry}: {firstTry}/{session.questions.length}</Text>
      {titles.length ? <View style={[s.memoryCard, { backgroundColor: theme.berryTint, borderColor: theme.berryLine }]}><Text style={s.heading}>{ui.reinforce}</Text>{titles.map(title => <Text key={title} style={s.body}>• {title}</Text>)}</View> : null}
      {memory ? <LearningMemoryCard title={ui.zh ? '趁热记一下' : 'Make it memorable'} description={ui.reviewMemory} label={ui.zh ? '开始记忆练习' : 'Start memory practice'} disabled={disabled} onPress={() => router.push(`/community/education/${encodeURIComponent(session.courseId)}/memory?memorySetId=${encodeURIComponent(memory.id)}` as Href)} /> : null}
      {session.isComplete && missedIds.length ? <LearningButton secondary label={copy.guidedLessonRetryMissed} disabled={disabled} onPress={() => onPractice(missedIds)} /> : null}
      {session.isComplete ? <LearningButton secondary label={copy.guidedLessonRetryAll} disabled={disabled} onPress={() => onPractice(session.questions.map(item => item.question.id))} /> : null}
    </ScrollView>
    <View style={[s.dock, { paddingBottom: Math.max(16, insets.bottom) }]}>
      {disabled ? <LearningButton disabled={loading} label={loading ? copy.practiceChecking : copy.retry} loading={loading} onPress={onRetry} />
        : !session.isComplete && continueIds.length ? <LearningButton label={ui.continue} onPress={() => onPractice(continueIds)} />
          : <LearningButton label={copy.publicPracticeReturn} onPress={onExit} />}
    </View>
  </View>;
}
