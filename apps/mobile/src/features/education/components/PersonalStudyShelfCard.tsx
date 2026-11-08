import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AnimatedPressable from '@/components/AnimatedPressable';
import type { PersonalStudySummary } from '../api/personalStudy.api';
import { useLearningCopy } from './LearningUi';
import { usePersonalLibraryStyles } from './personalStudyLibraryStyles';

export function PersonalStudyShelfCard({ course, onPress }: { course: PersonalStudySummary; onPress: () => void }) {
  const { styles: s, theme } = usePersonalLibraryStyles(); const { zh } = useLearningCopy();
  const draft = !course.readyToLearn;
  const language = course.languageCode?.startsWith('zh') ? (zh ? '中文' : 'Chinese')
    : course.languageCode?.startsWith('en') ? 'English' : course.languageCode === 'ms' ? 'Bahasa Melayu' : course.languageCode;
  const mark = course.languageCode?.startsWith('zh') ? '字' : course.languageCode?.startsWith('en') ? 'Aa' : course.languageCode === 'ms' ? 'BM' : '＋';
  const action = draft ? (zh ? '继续编辑' : 'Continue editing') : (zh ? '开始学习' : 'Start learning');
  return <AnimatedPressable accessibilityRole="button" accessibilityLabel={`${course.title} · ${course.studyItemCount} ${zh ? '张卡片' : 'cards'} · ${action}`} onPress={onPress} style={s.card}>
    <View style={s.cardMain}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[s.cover, draft && s.coverDraft]}>
        <Ionicons name={draft ? 'create-outline' : 'book-outline'} size={23} color={draft ? theme.violetDeep : theme.onAccent} />
        <Text style={[s.coverLanguage, draft && s.coverDraftLanguage]}>{mark}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
        <Text numberOfLines={2} style={s.title}>{course.title}</Text>
        <View style={[s.row, { flexWrap: 'wrap', gap: 5 }]}><Ionicons name="albums-outline" size={14} color={theme.inkSoft} /><Text style={s.small}>{zh ? `${course.studyItemCount} 张卡片` : `${course.studyItemCount} cards`}{language ? ` · ${language}` : ''}</Text></View>
      </View>
    </View>
    <View style={s.cardFooter}>
      <View style={[s.status, draft && s.draftStatus]}>
        <Ionicons name={draft ? 'pencil-outline' : 'checkmark-circle-outline'} size={13} color={draft ? theme.violetDeep : theme.successText} />
        <Text style={[s.statusText, draft && s.draftStatusText]}>{draft ? (zh ? '草稿' : 'Draft') : (zh ? '可以开始学' : 'Ready to learn')}</Text>
      </View>
      <View style={s.row}><Text style={s.action}>{action}</Text><Ionicons name="arrow-forward" size={17} color={theme.violetDeep} /></View>
    </View>
  </AnimatedPressable>;
}
