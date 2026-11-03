import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthProvider';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { consumeOcrDraft, saveOcrDraft } from '@/features/memory-composer/utils/ocrDraftStore';
import { firstParam } from '@/features/memory-composer/utils/composerParams';
import { LearningHeader } from '../components/LearningHeader';
import { LearningButton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { createStudyCourseDraft } from '../api/educationCourseDraft.api';
import { getEducationAuthoringPortalUrl } from '../utils/educationAuthoringPortal';
import { parseEducationStudyList, isValidEducationStudyList } from '../utils/educationStudyList';

export default function EducationCreateCourseScreen() {
  const { user } = useAuth();
  return user?.accountMode === 'RestrictedLearner' ? <Redirect href="/education/assignments" /> : <CourseDraftEditor key={user?.id ?? 'anonymous'} />;
}

function CourseDraftEditor() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ ocrDraftId?: string | string[] }>();
  const { styles: s, theme } = useLearningStyles();
  const { zh } = useLearningCopy();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState(zh ? 'zh-Hans' : 'en');
  const [preview, setPreview] = useState(false);
  const [notice, setNotice] = useState('');
  const mutation = useMutation({ mutationFn: createStudyCourseDraft, retry: false });
  const [pendingExit, setPendingExit] = useState<NavigationAction | null>(null);
  const [discardConfirmed, setDiscardConfirmed] = useState(false);
  const [scanRoute, setScanRoute] = useState<Href | null>(null);
  const hasUnsavedContent = !mutation.data && !!(title.trim() || text.trim());
  usePreventRemove((hasUnsavedContent || mutation.isPending) && !discardConfirmed && !scanRoute,
    ({ data }) => { if (!mutation.isPending) setPendingExit(data.action); });
  useEffect(() => {
    if (discardConfirmed && pendingExit) navigation.dispatch(pendingExit);
  }, [discardConfirmed, pendingExit, navigation]);
  useEffect(() => {
    if (scanRoute) router.replace(scanRoute);
  }, [scanRoute, router]);
  useEffect(() => {
    const draftId = firstParam(params.ocrDraftId);
    if (!draftId) return;
    const draft = consumeOcrDraft(draftId);
    if (!draft) return;
    setText(draft.items.join('\n'));
    if (draft.title) setTitle(draft.title);
    if (draft.languageCode) setLanguage(draft.languageCode);
    setPreview(false);
  }, [params.ocrDraftId]);
  const entries = parseEducationStudyList(text);
  const valid = title.trim().length > 0 && title.trim().length <= 200 && isValidEducationStudyList(entries);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/learn' as Href); };
  const inputStyle = [s.card, s.body, { minHeight: 52 }];
  const portal = getEducationAuthoringPortalUrl();
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <LearningHeader title={zh ? '制作我的小课' : 'Create my lessons'} showAiCredits={false} backAction={mutation.isPending ? () => {} : preview && !mutation.data ? () => setPreview(false) : back} />
    <ScrollView key={preview ? 'preview' : 'edit'} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content, { paddingBottom: 24, gap: 16 }]}>
      {mutation.data ? <View style={[s.card, { gap: 16 }]}>
        <Text style={s.title}>{zh ? '小课草稿准备好了！' : 'Your lesson draft is ready!'}</Text>
        <Text style={s.body}>{zh ? `已保存 ${mutation.data.studyItemCount} 张教学卡片和 ${mutation.data.practiceQuestionCount} 道文字回忆题。` : `Saved ${mutation.data.studyItemCount} study cards and ${mutation.data.practiceQuestionCount} written recall questions.`}</Text>
        <Text style={s.small}>{zh ? '内容仍是私人草稿。请到学习工作区检查、发布，再分配给孩子。' : 'This is a private draft. Review and publish it in the learning workspace before assigning it to your child.'}</Text>
        {portal ? <LearningButton label={zh ? '到工作区继续编辑' : 'Continue in the workspace'} onPress={() => {
          const url = new URL(`/education/courses/${encodeURIComponent(mutation.data.courseId)}`, portal).toString();
          void Linking.openURL(url).catch(() => setNotice(zh ? '无法打开工作区，请稍后重试。' : 'Could not open the workspace. Please retry.'));
        }} /> : <LearningButton label={zh ? '返回学习' : 'Back to learning'} onPress={back} />}
      </View> : <>
        {!preview && <>
        <View style={[s.card, { backgroundColor: theme.violetTint, gap: 8 }]}><Text style={s.heading}>{zh ? '让学校词表变成一节小课' : 'Turn a word list into a little lesson'}</Text><Text style={s.body}>{zh ? '扫描或粘贴 → 确认词语 → 预览草稿' : 'Scan or paste → Check the words → Preview'}</Text></View>
        <LearningButton secondary label={zh ? '扫描学习资料' : 'Scan study material'} disabled={mutation.isPending} onPress={() => {
          const id = saveOcrDraft(entries.map(entry => entry.meaning ? `${entry.text}\t${entry.meaning}` : entry.text), { title, languageCode: language });
          setScanRoute(`/scan-memory?destination=study&sourceDraftId=${encodeURIComponent(id)}` as Href);
        }} />
        <Text style={s.heading}>{zh ? '小课名称' : 'Course title'}</Text>
        <TextInput accessibilityLabel={zh ? '小课名称' : 'Course title'} value={title} onChangeText={setTitle} editable={!mutation.isPending} maxLength={200} placeholder={zh ? '例如：星期五听写词表' : 'For example: Friday word list'} placeholderTextColor={theme.inkSoft} style={inputStyle} />
        <Text style={s.heading}>{zh ? '内容语言' : 'Content language'}</Text>
        <View style={[s.row, { flexWrap: 'wrap', gap: 8 }]}>{[{ code: 'zh-Hans', label: '中文' }, { code: 'en', label: 'English' }, { code: 'ms', label: 'Bahasa Melayu' }].map(option => <AnimatedPressable key={option.code} accessibilityRole="radio" aria-checked={language === option.code} accessibilityState={{ checked: language === option.code, disabled: mutation.isPending }} disabled={mutation.isPending} onPress={() => setLanguage(option.code)} style={[s.card, { minHeight: 44, padding: 12, backgroundColor: language === option.code ? theme.violetTint : theme.paper }]}><Text style={s.small}>{language === option.code ? '✓ ' : ''}{option.label}</Text></AnimatedPressable>)}</View>
        <Text style={s.heading}>{zh ? '词表（每行一个词）' : 'Word list (one word per line)'}</Text>
        <TextInput accessibilityLabel={zh ? '词表' : 'Word list'} multiline textAlignVertical="top" value={text} onChangeText={value => { setText(value); setPreview(false); }} editable={!mutation.isPending} maxLength={52000} placeholder={'school\t学校\npencil\t铅笔\nbook'} placeholderTextColor={theme.inkSoft} style={[...inputStyle, { minHeight: 180 }]} />
        <Text style={s.small}>{zh ? '1–50 个不重复的词。可粘贴表格中的「词语 + 释义」两列；没有释义时只生成教学卡片。' : 'Use 1–50 unique words. Paste word and meaning columns from a table; words without clues create study cards only.'}</Text>
        {text.trim() && !isValidEducationStudyList(entries) ? <Text accessibilityRole="alert" style={s.body}>{zh ? '请检查：词语不能重复或为空，最多 50 个，每个词及释义不能超过 500 字。' : 'Check for duplicate or missing words. Use at most 50 entries and 500 characters per word or meaning.'}</Text> : null}
        </>}
        {preview && <><Text style={s.title}>{title}</Text><Text style={s.small}>{zh ? `${Math.ceil(entries.length / 5)} 节小课 · ${entries.length} 张教学卡片` : `${Math.ceil(entries.length / 5)} lessons · ${entries.length} study cards`}</Text>
          {Array.from({ length: Math.ceil(entries.length / 5) }, (_, lesson) => <View key={lesson} style={[s.card, { gap: 12 }]}>
            <Text style={[s.heading, { color: theme.violetDeep }]}>{zh ? `小课 ${lesson + 1}` : `Lesson ${lesson + 1}`}</Text>
            {entries.slice(lesson * 5, lesson * 5 + 5).map((entry, index) => <View key={index} style={{ gap: 4 }}><Text style={s.heading}>{entry.text}</Text>{entry.meaning && <Text style={s.body}>{entry.meaning}</Text>}</View>)}
          </View>)}
        </>}
        <Text style={s.small}>{zh ? '先保存为私人草稿，不会自动发布或分配。这里不会生成听写或口语评分题。' : 'Saved as a private draft, never automatically published or assigned. This does not generate dictation or speech scoring.'}</Text>
        {mutation.isError && <Text accessibilityRole="alert" style={s.body}>{zh ? '保存失败。请检查词表后重试，输入仍保留在这里。' : 'Could not save. Check the word list and retry; your input is still here.'}</Text>}
      </>}
      {notice ? <Text accessibilityRole="alert" style={s.body}>{notice}</Text> : null}
    </ScrollView>
    {!mutation.data && <View style={[s.dock, { paddingBottom: Math.max(12, insets.bottom), gap: 8 }]}>
      {preview && <AnimatedPressable accessibilityRole="button" disabled={mutation.isPending} onPress={() => setPreview(false)} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={[s.small, { color: theme.violetDeep }]}>{zh ? '修改词表' : 'Edit word list'}</Text></AnimatedPressable>}
      <LearningButton disabled={!valid} loading={mutation.isPending} label={preview ? (zh ? '保存小课草稿' : 'Save lesson draft') : (zh ? '预览小课' : 'Preview lessons')} onPress={() => {
        Keyboard.dismiss();
        if (!preview) setPreview(true); else mutation.mutate({ title: title.trim(), languageCode: language, entries });
      }} />
    </View>}
    <ConfirmModal visible={!!pendingExit && !discardConfirmed}
      title={zh ? '离开未保存的小课？' : 'Leave this unsaved lesson?'}
      description={zh ? '词表还没有保存。离开后，这次输入会丢失。' : 'Your word list has not been saved. Leaving will discard this input.'}
      confirmText={zh ? '放弃并离开' : 'Discard and leave'} cancelText={zh ? '继续编辑' : 'Keep editing'}
      destructive onCancel={() => setPendingExit(null)} onConfirm={() => setDiscardConfirmed(true)} />
  </KeyboardAvoidingView>;
}
