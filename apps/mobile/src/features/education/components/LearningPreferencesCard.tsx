import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '@/components/AnimatedPressable';
import { useEducationLearningPreferences } from '../hooks/useEducationLearningPreferences';
import { defaultLearningPreferences, learningPreferenceChoices, type LearningPreferences } from '../utils/educationLearningPreferences';
import { courseAudienceLabels } from '../utils/educationCourseAudience';
import { LearningButton, useLearningCopy, useLearningStyles } from './LearningUi';

export function LearningPreferencesCard({ userId }: { userId: string }) {
  const { query, save } = useEducationLearningPreferences(userId);
  const { styles: s, theme } = useLearningStyles();
  const ui = useLearningCopy();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LearningPreferences>(defaultLearningPreferences);
  const title = ui.zh ? '你的学习偏好' : 'Your learning preferences';
  const label = (field: keyof LearningPreferences, value: string) => value === 'all' ? ui.all
    : field === 'subject' ? ui[value as 'chinese' | 'english' | 'math' | 'science']
      : courseAudienceLabels(field === 'stage' ? { learningStage: value } : { languageCode: value }, ui.zh)[0];
  const summary = query.data ? (Object.keys(learningPreferenceChoices) as (keyof LearningPreferences)[])
    .filter(field => query.data![field] !== 'all').map(field => label(field, query.data![field])).join(' · ') : '';
  return <>
    <AnimatedPressable accessibilityRole="button" disabled={query.isLoading} accessibilityState={{ expanded: open, disabled: query.isLoading }}
      onPress={() => { save.reset(); setDraft(query.data ?? defaultLearningPreferences); setOpen(true); }}
      style={{ minHeight: 52, flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: theme.violetTint }}>
      <Ionicons name="compass-outline" size={24} color={theme.violetDeep} />
      <View style={{ flex: 1, gap: 3 }}><Text style={[s.small, { color: theme.violetDeep }]}>{title}</Text>
        <Text style={s.small}>{query.isLoading ? (ui.zh ? '正在读取偏好…' : 'Loading preferences…') : summary || (ui.zh ? '选阶段、科目和语言，让第一课更适合你' : 'Choose a stage, subject and language for your first lesson')}</Text></View>
      <Ionicons name="chevron-forward" size={20} color={theme.violetDeep} />
    </AnimatedPressable>
    <Modal transparent visible={open} animationType="none" onRequestClose={() => { if (!save.isPending) setOpen(false); }}>
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingTop: insets.top + 20, backgroundColor: 'rgba(20,20,40,.4)' }}>
        <View style={{ maxHeight: '95%', backgroundColor: theme.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: Math.max(20, insets.bottom), gap: 16 }}>
          <ScrollView contentContainerStyle={{ gap: 16 }}>
            <Text accessibilityRole="header" style={s.title}>{title}</Text>
            <Text style={s.body}>{ui.zh ? '只影响推荐，不限制你能学什么。偏好保存在这台设备，随时可以更改。' : 'Personalize recommendations without limiting what you can learn. Saved on this device and changeable anytime.'}</Text>
            {query.isError ? <LearningButton secondary label={ui.zh ? '无法读取偏好，重试' : 'Could not load preferences. Retry'} onPress={() => void query.refetch()} /> : null}
            {(Object.keys(learningPreferenceChoices) as (keyof LearningPreferences)[]).map(field => <View key={field} style={{ gap: 8 }}>
              <Text accessibilityRole="header" style={s.heading}>{field === 'subject' ? (ui.zh ? '想学什么？' : 'What interests you?') : field === 'stage' ? (ui.zh ? '学习阶段' : 'Learning stage') : (ui.zh ? '内容语言' : 'Content language')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{learningPreferenceChoices[field].map(value => <AnimatedPressable key={value} accessibilityRole="button" accessibilityState={{ selected: draft[field] === value }} disabled={save.isPending}
                onPress={() => setDraft({ ...draft, [field]: value })} style={{ minHeight: 44, justifyContent: 'center', borderRadius: 99, paddingHorizontal: 14, borderWidth: 2, borderColor: theme.line, backgroundColor: draft[field] === value ? theme.violetDeep : theme.paper }}>
                <Text style={[s.small, { color: draft[field] === value ? theme.onAccent : theme.ink }]}>{label(field, value)}</Text>
              </AnimatedPressable>)}</View>
            </View>)}
            {save.isError ? <Text accessibilityRole="alert" style={s.body}>{ui.zh ? '偏好未保存，请重试。你的选择还在。' : 'Could not save. Your choices are still here; please retry.'}</Text> : null}
          </ScrollView>
          <LearningButton loading={save.isPending} disabled={query.isLoading || query.isError} label={ui.zh ? '保存学习偏好' : 'Save preferences'} onPress={() => save.mutate({ userId, preferences: draft }, { onSuccess: () => setOpen(false) })} />
          <AnimatedPressable accessibilityRole="button" disabled={save.isPending} onPress={() => setOpen(false)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={[s.small, { color: theme.violetDeep }]}>{ui.zh ? '暂时不改，直接探索' : 'Keep exploring for now'}</Text></AnimatedPressable>
        </View>
      </View>
    </Modal>
  </>;
}
