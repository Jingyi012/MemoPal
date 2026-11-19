import { AppText as Text } from '@/components/ui/AppText';
import { appSpacing } from '@/theme/designSystem';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthProvider';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import { consumeOcrDraft, saveOcrDraft } from '@/features/memory-composer/utils/ocrDraftStore';
import { firstParam } from '@/features/memory-composer/utils/composerParams';
import { reorderItems } from '@/features/memory-composer/utils/reorderItems';
import { LearningHeader } from '../components/LearningHeader';
import { LearningIconButton } from '../components/LearningIconButton';
import { LearningContentHelpSheet } from '../components/LearningContentHelpSheet';
import { LearningDraftBasics } from '../components/LearningDraftBasics';
import { LearningDraftUnits } from '../components/LearningDraftUnits';
import { LearningDraftPreviewUnit } from '../components/LearningDraftPreviewUnit';
import { LearningDraftPracticePreview } from '../components/LearningDraftPracticePreview';
import { LearningDraftPreviewSummary } from '../components/LearningDraftPreviewSummary';
import { LearningDraftWordSheet, type EditingDraftWord } from '../components/LearningDraftWordSheet';
import { useDraftStyles } from '../components/learningDraftStyles';
import { LearningButton, LearningSkeleton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { createStudyCourseDraft, estimateStudyCourseGeneration, generateStudyCourseDraft, recoverStudyCourseGeneration, type EducationCourseAiInput, type EducationCourseContentType, type StudyCourseAiOutput, type StudyCourseGenerationResult } from '../api/educationCourseDraft.api';
import { clearEducationCourseGenerationRecovery, getEducationCourseGenerationRecovery, saveEducationCourseGenerationRecovery } from '../services/educationCourseGenerationRecovery.service';
import { usePersonalStudyCourse } from '../hooks/usePersonalStudy';
import { personalStudyKeys } from '../api/personalStudy.api';
import { educationDraftSaveError } from '../utils/educationDraftSaveError';
import { invalidateCourseDraftQuestions, isRepeatedCourseMeaning } from '../utils/invalidateCourseDraftQuestions';
import { addDraftWords, changeDraftWord, draftUnitsPayload, draftUnitsReady, newDraftUnit, type DraftImportMode, type DraftUnit, type DraftWord } from '../utils/educationDraftEditor';

export default function EducationCreateCourseScreen() {
  const { user } = useAuth();
  return user?.accountMode === 'RestrictedLearner' ? <Redirect href="/education/assignments" /> : <CourseDraftEditor key={user?.id ?? 'anonymous'} />;
}

function CourseDraftEditor() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ ocrDraftId?: string | string[]; draftId?: string }>();
  const { styles: common } = useLearningStyles();
  const { styles: s, theme } = useDraftStyles();
  const { zh } = useLearningCopy();
  const insets = useSafeAreaInsets();
  const help = useRef<BottomSheetModal>(null);
  const wordSheet = useRef<BottomSheetModal>(null);
  const scroll = useRef<ScrollView>(null);
  const { user } = useAuth();
  const client = useQueryClient();
  const hydrated = useRef('');
  const editorContentRef = useRef(false);
  // Once loaded, the local form owns edits. A superseded draft may be archived
  // after saving; refocusing must not reload that old ID over the editor.
  const draft = usePersonalStudyCourse(params.draftId ?? '', hydrated.current !== params.draftId);
  const [sourceDraftId, setSourceDraftId] = useState<string>();
  const [startAfterSave, setStartAfterSave] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState(zh ? 'zh-Hans' : 'en');
  const [meaningLanguage, setMeaningLanguage] = useState(zh ? 'zh-Hans' : 'en');
  const [difficulty, setDifficulty] = useState<'basic' | 'advanced'>('basic');
  const [contentType, setContentType] = useState<EducationCourseContentType>('LanguageItem');
  const [mode, setMode] = useState<DraftImportMode>('manual');
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<DraftUnit[]>(() => [newDraftUnit()]);
  const [activeId, setActiveId] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const editorSnapshot = JSON.stringify({ title, language, units, inputs, contentType });
  editorContentRef.current = !!(title.trim() || units.some(unit => unit.title.trim() || unit.words.length) || Object.values(inputs).some(value => value.trim()));
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<EditingDraftWord | null>(null);
  const [wordError, setWordError] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [generatedOutput, setGeneratedOutput] = useState<StudyCourseAiOutput | null>(null);
  const [generationId, setGenerationId] = useState<string | undefined>();
  const [generationStatus, setGenerationStatus] = useState('');
  const [chargedCredits, setChargedCredits] = useState(0);
  const [generationInput, setGenerationInput] = useState<EducationCourseAiInput | null>(null);
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [generationRunning, setGenerationRunning] = useState(false);
  const [confirmedSuggestionIds, setConfirmedSuggestionIds] = useState<string[]>([]);
  const [includedQuestionIndexes, setIncludedQuestionIndexes] = useState<number[]>([]);
  const [expandedQuestionUnitIds, setExpandedQuestionUnitIds] = useState<string[]>([]);
  const generationRequest = useRef<{ snapshot: string; id: string; maxCredits: number } | null>(null);
  const recoveryStarted = useRef(false);
  const [removeUnit, setRemoveUnit] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: createStudyCourseDraft, retry: false,
    onSuccess: async data => {
      await Promise.all([
        client.invalidateQueries({ queryKey: personalStudyKeys.list(user?.id ?? '') }),
        client.invalidateQueries({ queryKey: personalStudyKeys.course(user?.id ?? '', data.courseId) }),
      ]);
    },
  });
  useEffect(() => {
    if (!draft.data || hydrated.current === draft.data.id) return;
    hydrated.current = draft.data.id;
    const value = draft.data;
    const languageCode = value.languageCode ?? (zh ? 'zh-Hans' : 'en');
    const loadedUnits = value.units.map(unit => ({ id: unit.id, title: unit.title, words: unit.studyItems.map(item => ({ id: item.id, text: item.primary, meaning: item.secondary })) }));
    const savedContentType = value.units[0]?.studyItems[0]?.kind;
    if (savedContentType && ['LanguageItem', 'VocabularyPair', 'ConceptUnderstanding', 'VerbatimText'].includes(savedContentType)) setContentType(savedContentType as EducationCourseContentType);
    setTitle(value.title); setLanguage(languageCode); setUnits(loadedUnits);
    setSavedSnapshot(JSON.stringify({ title: value.title, language: languageCode, units: loadedUnits, inputs: {}, contentType: savedContentType ?? 'LanguageItem' }));
    setSourceDraftId(value.readyToLearn ? undefined : value.id); setInputs({}); setStep(1);
  }, [draft.data, zh]);
  useEffect(() => {
    if (!mutation.data) return;
    if (user?.id) void clearEducationCourseGenerationRecovery(user.id);
    setSavedSnapshot(editorSnapshot);
    if (mutation.data.readyToLearn && startAfterSave) router.replace(`/education/my-courses/${mutation.data.courseId}?start=1` as Href);
    else setSourceDraftId(mutation.data.courseId);
  }, [mutation.data, router, startAfterSave, editorSnapshot, user?.id]);
  const [pendingExit, setPendingExit] = useState<NavigationAction | null>(null);
  const [discardConfirmed, setDiscardConfirmed] = useState(false);
  const [scanRoute, setScanRoute] = useState<Href | null>(null);
  const hasUnsavedContent = !mutation.data && editorSnapshot !== savedSnapshot && !!(title.trim() || units.some(unit => unit.title.trim() || unit.words.length) || Object.values(inputs).some(value => value.trim()));
  usePreventRemove((hasUnsavedContent || mutation.isPending || generationRunning) && !discardConfirmed && !scanRoute,
    ({ data }) => { if (!mutation.isPending && !generationRunning) setPendingExit(data.action); });
  useEffect(() => { if (discardConfirmed && pendingExit) navigation.dispatch(pendingExit); }, [discardConfirmed, pendingExit, navigation]);
  useEffect(() => { if (scanRoute) router.replace(scanRoute); }, [scanRoute, router]);
  useEffect(() => {
    const draft = consumeOcrDraft(firstParam(params.ocrDraftId));
    if (!draft) return;
    if (draft.title) setTitle(draft.title);
    if (draft.languageCode) setLanguage(draft.languageCode);
    const snapshot = draft.studyEditor;
    const restored = snapshot?.units ?? [newDraftUnit()];
    const target = snapshot?.targetUnitId ?? restored[0].id;
    const pending = snapshot?.inputs ?? {};
    const scanned = draft.items.join('\n');
    setUnits(restored);
    if (snapshot?.contentType) setContentType(snapshot.contentType);
    setInputs({ ...pending, [target]: [pending[target], scanned].filter(Boolean).join('\n') });
    setActiveId(target);
    setMode(scanned ? 'scan' : snapshot?.mode ?? 'manual');
    setStep(1);
  }, [params.ocrDraftId, zh]);
  const total = units.reduce((count, unit) => count + unit.words.length, 0);
  const unresolvedMeaningCount = generatedOutput ? units.flatMap(unit => unit.words).filter(word =>
    !word.meaning?.trim() || generatedOutput.suggestions.some(item => item.entryId === word.id && item.needsReview
      && word.meaning === item.meaning && !confirmedSuggestionIds.includes(item.entryId))).length : 0;
  const practicedEntryIds = new Set((generatedOutput?.questions ?? []).flatMap((question, index) => {
    if (!includedQuestionIndexes.includes(index)) return [];
    return question.type === 'matching' ? (question.pairs ?? []).map(pair => pair.entryId) : [question.entryId];
  }));
  const wordsWithoutPractice = generatedOutput ? units.flatMap(unit => unit.words).filter(word => !practicedEntryIds.has(word.id)).length : 0;
  const aiInput = useMemo(() => ({ title: title.trim(), languageCode: language,
    meaningLanguageCode: meaningLanguage, difficulty, contentType,
    units: units.map((unit, index) => ({ id: unit.id, title: unit.title.trim() || (zh ? `单元 ${index + 1}` : `Unit ${index + 1}`),
      entries: unit.words.map(word => ({ id: word.id, text: word.text, meaning: word.meaning })) })) }), [contentType, difficulty, language, meaningLanguage, title, units, zh]);
  const estimate = useQuery({ queryKey: ['education-course-ai-estimate', aiInput], queryFn: () => estimateStudyCourseGeneration(aiInput), enabled: step === 1 && draftUnitsReady(units) && !Object.values(inputs).some(value => value.trim()) });
  const applyGenerationResult = (result: StudyCourseGenerationResult, input: EducationCourseAiInput) => {
    if (!result.output) { setRecoveryPending(true); return; }
    const meanings = new Map(result.output.suggestions.filter(item => !item.needsReview).map(item => [item.entryId, item.meaning]));
    const approved = result.output.suggestions.filter(item => !item.needsReview).map(item => item.entryId);
    const restoredUnits = input.units.map(unit => ({ id: unit.id, title: unit.title,
      words: unit.entries.map(entry => ({ id: entry.id, text: entry.text, meaning: entry.meaning?.trim() ? entry.meaning : meanings.get(entry.id) ?? entry.meaning })) }));
    setTitle(input.title); setLanguage(input.languageCode); setMeaningLanguage(input.meaningLanguageCode); setDifficulty(input.difficulty); setContentType(input.contentType ?? 'LanguageItem');
    setUnits(restoredUnits); setInputs({}); setGeneratedOutput(result.output); setGenerationId(result.generationId);
    setGenerationStatus(result.status); setChargedCredits(result.charged); setGenerationInput(input);
    setConfirmedSuggestionIds(approved); setIncludedQuestionIndexes(result.output.questions.map((_, index) => index));
    setExpandedQuestionUnitIds(input.units[0] ? [input.units[0].id] : []);
    setRecoveryPending(false); setStep(2); setNotice('');
  };
  const generateMutation = useMutation({ mutationFn: async () => {
    const snapshot = JSON.stringify(aiInput);
    if (!generationRequest.current || generationRequest.current.snapshot !== snapshot)
      generationRequest.current = { snapshot, id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`, maxCredits: estimate.data?.maxCredits ?? 0 };
    if (!user?.id) throw new Error('Sign in before preparing study content.');
    await saveEducationCourseGenerationRecovery(user.id, { requestId: generationRequest.current.id, input: aiInput, createdAt: Date.now(), maxCredits: generationRequest.current.maxCredits });
    return { result: await generateStudyCourseDraft(generationRequest.current.id, generationRequest.current.maxCredits, aiInput), input: aiInput };
  }, retry: false, onMutate: () => setGenerationRunning(true), onSettled: () => setGenerationRunning(false),
  onSuccess: ({ result, input }) => applyGenerationResult(result, input) });
  const invalidateQuestions = (entryIds: string[]) => {
    const next = invalidateCourseDraftQuestions(generatedOutput, generationInput, includedQuestionIndexes, entryIds);
    if (next.length < includedQuestionIndexes.length) {
      setIncludedQuestionIndexes(next);
      setNotice(zh ? '相关练习已从预览移除，因为它引用的词语或意思已更改。' : 'Practice questions that referenced the changed entry were removed from this preview.');
    }
  };
  useEffect(() => {
    if (!user?.id || recoveryStarted.current || params.draftId || params.ocrDraftId || editorContentRef.current) return;
    recoveryStarted.current = true;
    let active = true;
    void (async () => {
      let recovery;
      try { recovery = await getEducationCourseGenerationRecovery(user.id); }
      catch { if (active) setNotice(zh ? '本机恢复记录暂时无法读取。' : 'Could not read the local recovery record.'); return; }
      if (!active || !recovery) return;
      if (editorContentRef.current) return;
      generationRequest.current = { id: recovery.requestId, snapshot: JSON.stringify(recovery.input), maxCredits: recovery.maxCredits };
      setTitle(recovery.input.title); setLanguage(recovery.input.languageCode); setMeaningLanguage(recovery.input.meaningLanguageCode);
      setDifficulty(recovery.input.difficulty); setContentType(recovery.input.contentType ?? 'LanguageItem'); setUnits(recovery.input.units.map(unit => ({ id: unit.id, title: unit.title,
        words: unit.entries.map(entry => ({ id: entry.id, text: entry.text, meaning: entry.meaning })) })));
      setInputs({}); setRecoveryPending(true); setAiEnabled(true); setStep(1);
      for (let attempt = 0; active && attempt < 30; attempt++) {
        try {
          const result = await recoverStudyCourseGeneration(recovery.requestId);
          if (!active) return;
          if ((result.status.toLowerCase() === 'completed' || result.status.toLowerCase() === 'partial') && result.output) { applyGenerationResult(result, recovery.input); return; }
          if (result.status.toLowerCase() === 'failed') {
            await clearEducationCourseGenerationRecovery(user.id); generationRequest.current = null;
            setRecoveryPending(false); setNotice(zh ? '上次生成失败，未扣费。旧请求不能重放；检查内容后重新发起即可。' : 'The previous request failed with no charge and cannot be replayed. Review the content and start a new request.'); return;
          }
        } catch { /* Keep the request ID for a later recovery attempt. */ }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (active) setNotice(zh ? '正在等待上次准备结果。再次点击可用相同请求恢复。' : 'Still waiting for the previous result. Tap to resume the same request.');
    })();
    return () => { active = false; };
  }, [user?.id, zh, params.draftId, params.ocrDraftId]);
  const errorText = zh ? '请检查重复词语或空行。总共最多 50 个词，每个词和释义最多 500 字。' : 'Check duplicates and missing words. Use up to 50 words, with 500 characters per word or meaning.';
  const scan = (targetId: string) => {
    Keyboard.dismiss();
    const id = saveOcrDraft([], { title, languageCode: language, studyEditor: { units, targetUnitId: targetId, inputs, mode, contentType } });
    setScanRoute(`/scan-memory?destination=study&sourceDraftId=${encodeURIComponent(id)}` as Href);
  };
  const add = (id: string) => {
    const next = addDraftWords(units, id, inputs[id] ?? '');
    if (!next) { setNotice(errorText); return; }
    setUnits(next); setInputs(previous => ({ ...previous, [id]: '' })); setNotice('');
  };
  const addUnit = () => {
    if (units.length >= 50) { setNotice(zh ? '最多 50 个单元。' : 'Use up to 50 units.'); return null; }
    const unit = newDraftUnit(); setUnits(previous => [...previous, unit]); setActiveId(unit.id); setNotice('');
    return unit.id;
  };
  const openWord = (word: DraftWord, unitId: string) => {
    Keyboard.dismiss(); setWordError(''); setEditing({ ...word, meaning: word.meaning ?? '', unitId }); wordSheet.current?.present();
  };
  const back = () => { if (step > 0 && !mutation.data) { setStep(step - 1); setNotice(''); } else if (router.canGoBack()) router.back(); else router.replace('/(tabs)/learn' as Href); };
  const save = (startLearning: boolean) => {
    setStartAfterSave(startLearning);
    mutation.mutate({ title: title.trim(), languageCode: language, meaningLanguageCode: meaningLanguage, difficulty,
      units: draftUnitsPayload(units, zh).map((unit, unitIndex) => ({ ...unit, stableId: units[unitIndex].id, entries: unit.entries.map((entry, entryIndex) => ({
        ...entry, stableId: units[unitIndex].words[entryIndex]?.id })) })), startLearning, sourceDraftId, generationId,
      confirmedSuggestionIds, includedQuestionIndexes, memoryContentType: contentType });
  };
  const next = () => {
    Keyboard.dismiss(); setNotice('');
    if (step === 0) { setStep(1); if (mode === 'scan') scan(units[0].id); return; }
    if (step === 1) {
      let nextUnits = units;
      let confirmedPending = false;
      for (const unit of units) {
        if (!inputs[unit.id]?.trim()) continue;
        const added = addDraftWords(nextUnits, unit.id, inputs[unit.id]);
        if (!added) { setNotice(errorText); return; }
        nextUnits = added; confirmedPending = true;
      }
      if (!draftUnitsReady(nextUnits)) { setNotice(zh ? '每个单元至少添加一个词，或删除空单元。' : 'Add at least one word to every unit, or remove empty units.'); return; }
      setUnits(nextUnits); setInputs({});
      if (confirmedPending) { setNotice(zh ? '词语已加入。已更新 AI 费用，请再次检查后准备。' : 'Words added. The AI price has been updated; review it before continuing.'); return; }
      setStep(2); return;
    }
    save(true);
  };
  if (params.draftId && (draft.isLoading || draft.isError)) return <View style={common.page}>
    <LearningHeader title={zh ? '继续编辑' : 'Continue editing'} showAiCredits={false} />
    {draft.isLoading ? <LearningSkeleton /> : <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{zh ? '草稿加载失败。' : 'Could not load draft.'}</Text><LearningButton label={zh ? '重试' : 'Retry'} onPress={() => void draft.refetch()} /></View>}
  </View>;
  return <KeyboardAvoidingView style={common.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <LearningHeader title={step === 2 ? (zh ? '预览学习内容' : 'Review your course') : (zh ? '创建学习内容' : 'Create study content')} showAiCredits={false}
      actions={step === 2 && !mutation.data ? [{ component: <LearningIconButton icon="save-outline" label={zh ? '暂存草稿' : 'Save draft'} disabled={mutation.isPending || !draftUnitsReady(units)} onPress={() => save(false)} /> }] : []}
      titleAccessory={<LearningIconButton icon="help-circle-outline" variant="plain" label={zh ? '操作说明' : 'How this works'} onPress={() => { Keyboard.dismiss(); help.current?.present(); }} />}
      backAction={mutation.isPending || generateMutation.isPending ? () => {} : back} />
    <ScrollView ref={scroll} key={`${step}-${mutation.isSuccess}`} scrollEnabled={!dragging && !mutation.isPending && !generationRunning && !recoveryPending}
      pointerEvents={mutation.isPending || generationRunning || recoveryPending ? 'none' : 'auto'} importantForAccessibility={mutation.isPending || generationRunning || recoveryPending ? 'no-hide-descendants' : 'auto'}
      keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      {mutation.data ? <View style={s.card}>
        <Text style={s.title}>{mutation.data.readyToLearn ? (zh ? '学习内容已保存' : 'Study content saved') : (zh ? '草稿已暂存' : 'Draft saved')}</Text>
        <Text style={s.small}>{zh ? `${units.length} 个单元 · ${mutation.data.studyItemCount} 张卡片 · 仅自己可见` : `${units.length} units · ${mutation.data.studyItemCount} cards · Private`}</Text>
        {mutation.data.readyToLearn ? <LearningButton label={zh ? '开始学习' : 'Start learning'} onPress={() => router.replace(`/education/my-courses/${mutation.data.courseId}?start=1` as Href)} /> : <LearningButton label={zh ? '继续编辑' : 'Keep editing'} onPress={() => { mutation.reset(); setStep(1); }} />}
        <LearningButton secondary label={zh ? '我的学习资料' : 'My learning library'} onPress={() => router.replace('/(tabs)/learn' as Href)} />
      </View> : <>
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: appSpacing.sm }]}>
          {(zh ? ['基本信息', '确认内容', '预览'] : ['Basics', 'Check content', 'Preview']).map((label, index) => <View key={label} style={[s.row, { flex: 1, gap: appSpacing.xs }]}>
            <Text style={[s.badge, index <= step && { backgroundColor: theme.violetDeep, color: theme.onAccent }]}>{index < step ? '✓' : index + 1}</Text>
            <Text style={[s.small, { flexShrink: 1 }, index === step && { color: theme.violetDeep }]}>{label}</Text>
            {index < 2 ? <View style={{ flex: 1, height: 2, backgroundColor: index < step ? theme.violetDeep : theme.line }} /> : null}
          </View>)}
        </View>
        {step === 0 ? <LearningDraftBasics title={title} language={language} mode={mode} meaningLanguage={meaningLanguage} difficulty={difficulty} contentType={contentType}
          onTitle={setTitle} onLanguage={setLanguage} onMode={setMode} onMeaningLanguage={setMeaningLanguage} onDifficulty={setDifficulty}
          onContentType={value => { if (value !== contentType) { setContentType(value); setGeneratedOutput(null); setGenerationId(undefined); setGenerationInput(null); setIncludedQuestionIndexes([]); setConfirmedSuggestionIds([]); } }} /> : <>
          {step === 1 ? <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={[s.title, { flexShrink: 1 }]}>{title}</Text><Text style={s.small}>{zh ? `${units.length} 个单元 · ${total} 个条目` : `${units.length} units · ${total} entries`}</Text></View> : <LearningDraftPreviewSummary title={title} unitCount={units.length} cardCount={total} questionCount={generatedOutput ? includedQuestionIndexes.length : undefined} charged={generatedOutput ? chargedCredits : undefined} needsReview={unresolvedMeaningCount} withoutPractice={wordsWithoutPractice} />}
          {params.draftId && draft.data?.readyToLearn ? <View style={s.note}><Text style={s.small}>{zh ? '保留原课程与学习记录；保存后会创建私人副本。' : 'Your original course and learning history stay intact. Saving creates a private copy.'}</Text></View> : null}
          {step === 1 ? <><LearningDraftUnits units={units} inputs={inputs} mode={mode} contentType={contentType} activeId={activeId || units[0].id}
            onReveal={offset => requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, offset - 12), animated: false }))}
            onInput={(id, value) => { setInputs(previous => ({ ...previous, [id]: value })); setNotice(''); }} onAdd={add} onScan={scan}
            onRename={(id, value) => setUnits(previous => previous.map(unit => unit.id === id ? { ...unit, title: value } : unit))}
            onMeaning={(wordId, meaning) => { const old = units.flatMap(unit => unit.words).find(word => word.id === wordId); setNotice(''); if (old?.meaning !== (meaning || null)) invalidateQuestions([wordId]); setUnits(previous => previous.map(unit => ({ ...unit, words: unit.words.map(word => word.id === wordId ? { ...word, meaning: meaning || null } : word) }))); }}
            onWord={openWord} onNew={addUnit} onRemove={setRemoveUnit} />
            <View style={s.card}>
              <Text style={s.heading}>{zh ? '自动准备学习和练习' : 'Prepare study and practice'}</Text>
              <Text style={s.small}>{zh ? `AI 可为 ${units.flatMap(unit => unit.words).filter(word => !word.meaning?.trim()).length} 个缺少意思的词提出建议，并准备适合的练习。每单元最多 8 道，配对和回忆题可组合练习。` : `AI can suggest meanings for ${units.flatMap(unit => unit.words).filter(word => !word.meaning?.trim()).length} entries and create practice questions. Review everything in the preview.`}</Text>
              {Object.values(inputs).some(value => value.trim()) ? <Text style={s.small}>{zh ? '有待确认的输入。先将词语加入清单，费用才会准确。' : 'Some entries still need confirmation. Add them to the list to get an accurate price.'}</Text> : estimate.isLoading ? <Text style={s.small}>{zh ? '正在检查 AI 可用状态与费用…' : 'Checking AI availability and price…'}</Text> : estimate.isError ? <Text accessibilityRole="alert" style={s.error}>{zh ? '费用暂时无法读取。可重试，或关闭 AI 继续。' : 'Could not check the price. Retry, or turn off AI to continue.'}</Text> : estimate.data?.available ? <Text style={s.small}>{zh ? `最高 ${estimate.data.maxCredits} credits · 当前 ${estimate.data.availableCredits} credits` : `Up to ${estimate.data.maxCredits} credits · ${estimate.data.availableCredits} available`}</Text> : <Text style={s.small}>{estimate.data?.reason}</Text>}
              <AnimatedPressable accessibilityRole="switch" accessibilityState={{ checked: aiEnabled }} onPress={() => setAiEnabled(value => !value)} style={[s.row, { minHeight: 44 }]}>
                <Text style={[s.badge, aiEnabled && { backgroundColor: theme.violetDeep, color: theme.onAccent }]}>{aiEnabled ? '✓' : '○'}</Text>
                <Text style={[s.body, { flex: 1 }]}>{zh ? '使用 AI 准备（推荐）' : 'Use AI to prepare (recommended)'}</Text>
              </AnimatedPressable>
              <Text style={s.small}>{zh ? '当前课程内容会发送到已配置的 AI 服务。建议内容可先检查再保存。' : 'This course content is sent to the configured AI service. Review suggestions before saving.'}</Text>
            </View></> : <>
            {generationStatus.toLowerCase() === 'partial' || unresolvedMeaningCount > 0 ? <View style={s.note}><Text style={s.small}>{zh ? '部分内容需要检查。你可以编辑说明或移除不需要的练习后保存。' : 'Some content needs review. Edit notes or remove unwanted practice before saving.'}</Text></View> : null}
            {generatedOutput?.suggestions.length ? <View style={s.card}><Text style={s.heading}>{zh ? 'AI 意思建议' : 'AI meaning suggestions'}</Text>{generatedOutput.suggestions.map(item => {
              const word = units.flatMap(value => value.words).find(value => value.id === item.entryId);
              if (!word) return null;
              const confirmed = confirmedSuggestionIds.includes(item.entryId);
              const repeated = isRepeatedCourseMeaning(word.text, item.meaning);
              if (!item.needsReview && !repeated) return <View key={item.entryId} style={[s.row, { minHeight: 44 }]}><Text style={[s.body, { flex: 1 }]}>{word.text}</Text><Text style={[s.small, { flex: 1 }]}>{item.meaning}</Text><Text style={s.small}>{word.meaning === item.meaning ? (zh ? 'AI 已采用' : 'AI applied') : (zh ? '已编辑' : 'Edited')}</Text></View>;
              return <View key={item.entryId} style={s.note}><Text style={s.chipText}>{word.text}</Text><Text style={s.small}>{item.meaning}</Text>
                <Text style={s.small}>{repeated ? (zh ? '建议重复了原词，不能作为释义采用；请编辑填写正确意思。' : 'This repeats the source word and cannot be used as a meaning. Edit it with a correct meaning.') : (zh ? '需要确认 · 这条建议不会作为练习答案，除非你选择采用。' : 'Needs review · This suggestion will not be used as a practice answer unless you choose it.')}</Text>
                {!repeated ? <AnimatedPressable accessibilityRole="button" accessibilityState={{ checked: confirmed }} onPress={() => {
                  setUnits(previous => previous.map(unit => ({ ...unit, words: unit.words.map(value => value.id === word.id ? { ...value, meaning: confirmed ? null : item.meaning } : value) })));
                  setConfirmedSuggestionIds(previous => confirmed ? previous.filter(id => id !== item.entryId) : [...previous, item.entryId]);
                }} style={[s.chip, confirmed && s.selectedChip]}><Text style={s.chipText}>{confirmed ? (zh ? '已采用 · 撤销' : 'Applied · undo') : (zh ? '采用这个意思' : 'Use this meaning')}</Text></AnimatedPressable> : null}
              </View>;
            })}</View> : null}
            <LearningDraftPracticePreview prepared={!!generatedOutput} output={generatedOutput ?? { suggestions: [], questions: [] }} units={units}
              includedIndexes={includedQuestionIndexes} expandedUnitIds={expandedQuestionUnitIds} onChange={setIncludedQuestionIndexes}
              onPrepareAgain={() => { generationRequest.current = null; setStep(1); setNotice(''); }}
              renderStudyUnit={(unit, index) => <LearningDraftPreviewUnit compact unit={unit} index={index} count={units.length} onDrag={setDragging}
                onEdit={() => { setActiveId(unit.id); setStep(1); }} onMove={(from, to) => setUnits(previous => reorderItems(previous, from, to))} />}
              onToggleUnit={id => setExpandedQuestionUnitIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id])} />
            <AnimatedPressable accessibilityRole="button" style={s.dashed} onPress={() => { addUnit(); setStep(1); }}><Text style={s.chipText}>＋ {zh ? '再加一个单元' : 'Add another unit'}</Text></AnimatedPressable>
            <Text style={s.small}>{zh ? '仅自己可见，保存后就能开始学。' : 'Private to you. Start learning as soon as you save.'}</Text>
          </>}
        </>}
      </>}
      {draft.isError ? <Text accessibilityRole="alert" style={s.error}>{zh ? '草稿加载失败，请返回后重试。' : 'Could not load the draft. Go back and retry.'}</Text> : null}
      {notice ? <Text accessibilityRole="alert" style={s.error}>{notice}</Text> : null}
      {mutation.isError ? <Text accessibilityRole="alert" style={s.error}>{educationDraftSaveError(mutation.error, zh)}</Text> : null}
      {generateMutation.isError ? <Text accessibilityRole="alert" style={s.error}>{zh ? 'AI 准备失败，内容仍保留，可以重试或关闭 AI 后保存。' : 'AI could not prepare a reviewable result. Your content is still here; retry or turn off AI to save.'}</Text> : null}
    </ScrollView>
    {!mutation.data ? <View style={[common.dock, { paddingBottom: Math.max(12, insets.bottom), gap: appSpacing.sm }]}>
      {step !== 2 && step > 0 ? <Text style={[s.small, { textAlign: 'center' }]}>{zh ? `${total} 个条目 · ${units.length} 个单元` : `${total} entries · ${units.length} units`}</Text> : step === 0 ? <Text style={[s.small, { textAlign: 'center' }]}>{zh ? '下一步开始添加内容' : 'Next, add your content'}</Text> : null}
      {step === 1 && Object.values(inputs).some(value => value.trim()) ? <LearningButton disabled={!draftUnitsReady(units)} label={zh ? '确认加入并更新费用' : 'Confirm entries and update price'} onPress={next} />
        : step === 1 && recoveryPending ? <LearningButton loading={generationRunning} label={zh ? '恢复上次准备' : 'Resume previous preparation'} onPress={() => generateMutation.mutate()} />
        : step === 1 && aiEnabled && estimate.isLoading ? <LearningButton loading disabled label={zh ? '正在检查费用…' : 'Checking price…'} onPress={() => {}} />
        : step === 1 && aiEnabled && estimate.isError ? <LearningButton secondary label={zh ? '重试费用检查' : 'Retry price check'} onPress={() => void estimate.refetch()} />
        : step === 1 && aiEnabled && estimate.data?.available && estimate.data.maxCredits > estimate.data.availableCredits ? <LearningButton disabled label={zh ? '余额不足 · 可关闭 AI 继续' : 'Not enough credits · turn off AI to continue'} onPress={() => {}} />
        : step === 1 && aiEnabled && estimate.data?.available ? <LearningButton loading={generateMutation.isPending} disabled={!draftUnitsReady(units)}
        label={generateMutation.isPending ? (zh ? '正在补全意思并准备练习…' : 'Completing meanings and preparing practice…') : recoveryPending ? (zh ? '恢复上次准备' : 'Resume previous preparation') : (zh ? `准备并预览 · 最高 ${estimate.data.maxCredits} credits` : `Prepare and preview · up to ${estimate.data.maxCredits} credits`)} onPress={() => generateMutation.mutate()} />
        : step === 1 && aiEnabled && estimate.data && !estimate.data.available ? <LearningButton label={zh ? '继续（不使用 AI）' : 'Continue without AI'} onPress={next} />
        : step === 1 ? <LearningButton label={zh ? '预览并保存' : 'Preview and save'} onPress={next} /> : <LearningButton loading={mutation.isPending} disabled={draft.isLoading || !title.trim() || (step === 2 && !draftUnitsReady(units))}
        label={step === 0 ? (zh ? '继续' : 'Continue') : step === 1 ? (zh ? '下一步：预览' : 'Next: preview') : (zh ? '保存并开始学习' : 'Save and start learning')} onPress={next} />}
    </View> : null}
    <LearningContentHelpSheet ref={help} onClose={() => help.current?.dismiss()} />
    <LearningDraftWordSheet ref={wordSheet} word={editing} units={units} error={wordError} contentType={contentType} onChange={word => { setEditing(word); setWordError(''); }}
      onNewUnit={() => { const id = addUnit(); if (id && editing) setEditing({ ...editing, unitId: id }); }}
      onSave={() => { if (!editing) return; const before = units.flatMap(unit => unit.words.map(word => ({ word, unitId: unit.id }))).find(item => item.word.id === editing.id); const changed = changeDraftWord(units, editing.id, editing.unitId, editing.text, editing.meaning); if (!changed) { setWordError(errorText); return; } if (before && (before.word.text !== editing.text || before.word.meaning !== (editing.meaning || null) || before.unitId !== editing.unitId)) invalidateQuestions([editing.id]); setUnits(changed); wordSheet.current?.dismiss(); }}
      onDelete={() => { if (!editing) return; invalidateQuestions([editing.id]); setUnits(previous => previous.map(unit => ({ ...unit, words: unit.words.filter(word => word.id !== editing.id) }))); wordSheet.current?.dismiss(); }} />
    <ConfirmModal visible={!!removeUnit} title={zh ? '删除这个单元？' : 'Delete this unit?'} description={zh ? '里面的词语也会删除。' : 'Its words will also be removed.'}
      destructive confirmText={zh ? '删除' : 'Delete'} cancelText={zh ? '保留' : 'Keep'} onCancel={() => setRemoveUnit(null)} onConfirm={() => { const removed = units.find(unit => unit.id === removeUnit); if (removed) invalidateQuestions(removed.words.map(word => word.id)); setUnits(previous => previous.filter(unit => unit.id !== removeUnit)); setInputs(previous => { const next = { ...previous }; delete next[removeUnit!]; return next; }); setRemoveUnit(null); }} />
    <ConfirmModal visible={!!pendingExit && !discardConfirmed} title={zh ? '离开未保存的内容？' : 'Leave without saving?'}
      description={zh ? '这次输入还没有保存。' : 'Your changes have not been saved.'} confirmText={zh ? '放弃并离开' : 'Discard and leave'} cancelText={zh ? '继续编辑' : 'Keep editing'}
      destructive onCancel={() => setPendingExit(null)} onConfirm={() => setDiscardConfirmed(true)} />
  </KeyboardAvoidingView>;
}
