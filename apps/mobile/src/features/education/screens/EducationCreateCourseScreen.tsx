import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { LearningDraftWordSheet, type EditingDraftWord } from '../components/LearningDraftWordSheet';
import { useDraftStyles } from '../components/learningDraftStyles';
import { LearningButton, LearningSkeleton, useLearningCopy, useLearningStyles } from '../components/LearningUi';
import { createStudyCourseDraft } from '../api/educationCourseDraft.api';
import { usePersonalStudyCourse } from '../hooks/usePersonalStudy';
import { personalStudyKeys } from '../api/personalStudy.api';
import { educationDraftSaveError } from '../utils/educationDraftSaveError';
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
  // Once loaded, the local form owns edits. A superseded draft may be archived
  // after saving; refocusing must not reload that old ID over the editor.
  const draft = usePersonalStudyCourse(params.draftId ?? '', hydrated.current !== params.draftId);
  const [sourceDraftId, setSourceDraftId] = useState<string>();
  const [startAfterSave, setStartAfterSave] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState(zh ? 'zh-Hans' : 'en');
  const [mode, setMode] = useState<DraftImportMode>('manual');
  const [step, setStep] = useState(0);
  const [units, setUnits] = useState<DraftUnit[]>(() => [newDraftUnit()]);
  const [activeId, setActiveId] = useState('');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const editorSnapshot = JSON.stringify({ title, language, units, inputs });
  const [notice, setNotice] = useState('');
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState<EditingDraftWord | null>(null);
  const [wordError, setWordError] = useState('');
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
    setTitle(value.title); setLanguage(languageCode); setUnits(loadedUnits);
    setSavedSnapshot(JSON.stringify({ title: value.title, language: languageCode, units: loadedUnits, inputs: {} }));
    setSourceDraftId(value.readyToLearn ? undefined : value.id); setInputs({}); setStep(1);
  }, [draft.data, zh]);
  useEffect(() => {
    if (!mutation.data) return;
    setSavedSnapshot(editorSnapshot);
    if (mutation.data.readyToLearn && startAfterSave) router.replace(`/education/my-courses/${mutation.data.courseId}?start=1` as Href);
    else setSourceDraftId(mutation.data.courseId);
  }, [mutation.data, router, startAfterSave, editorSnapshot]);
  const [pendingExit, setPendingExit] = useState<NavigationAction | null>(null);
  const [discardConfirmed, setDiscardConfirmed] = useState(false);
  const [scanRoute, setScanRoute] = useState<Href | null>(null);
  const hasUnsavedContent = !mutation.data && editorSnapshot !== savedSnapshot && !!(title.trim() || units.some(unit => unit.title.trim() || unit.words.length) || Object.values(inputs).some(value => value.trim()));
  usePreventRemove((hasUnsavedContent || mutation.isPending) && !discardConfirmed && !scanRoute,
    ({ data }) => { if (!mutation.isPending) setPendingExit(data.action); });
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
    const added = scanned ? addDraftWords(restored, target, scanned) : restored;
    setUnits(added ?? restored);
    setInputs(added ? pending : { ...pending, [target]: [pending[target], scanned].filter(Boolean).join('\n') });
    setActiveId(target);
    setMode(snapshot?.mode ?? 'manual');
    setStep(1);
    if (!added) setNotice(zh ? '请检查扫描结果：有重复词语或超过 50 个词。' : 'Review scanned words for duplicates or a total over 50.');
  }, [params.ocrDraftId, zh]);
  const total = units.reduce((count, unit) => count + unit.words.length, 0);
  const errorText = zh ? '请检查重复词语或空行。总共最多 50 个词，每个词和释义最多 500 字。' : 'Check duplicates and missing words. Use up to 50 words, with 500 characters per word or meaning.';
  const scan = (targetId: string) => {
    Keyboard.dismiss();
    const id = saveOcrDraft([], { title, languageCode: language, studyEditor: { units, targetUnitId: targetId, inputs, mode } });
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
    mutation.mutate({ title: title.trim(), languageCode: language, units: draftUnitsPayload(units, zh), startLearning, sourceDraftId });
  };
  const next = () => {
    Keyboard.dismiss(); setNotice('');
    if (step === 0) { setStep(1); if (mode === 'scan') scan(units[0].id); return; }
    if (step === 1) {
      let nextUnits = units;
      for (const unit of units) {
        if (!inputs[unit.id]?.trim()) continue;
        const added = addDraftWords(nextUnits, unit.id, inputs[unit.id]);
        if (!added) { setNotice(errorText); return; }
        nextUnits = added;
      }
      if (!draftUnitsReady(nextUnits)) { setNotice(zh ? '每个单元至少添加一个词，或删除空单元。' : 'Add at least one word to every unit, or remove empty units.'); return; }
      setUnits(nextUnits); setInputs({}); setStep(2); return;
    }
    save(true);
  };
  if (params.draftId && (draft.isLoading || draft.isError)) return <View style={common.page}>
    <LearningHeader title={zh ? '继续编辑' : 'Continue editing'} showAiCredits={false} />
    {draft.isLoading ? <LearningSkeleton /> : <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{zh ? '草稿加载失败。' : 'Could not load draft.'}</Text><LearningButton label={zh ? '重试' : 'Retry'} onPress={() => void draft.refetch()} /></View>}
  </View>;
  return <KeyboardAvoidingView style={common.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <LearningHeader title={zh ? '创建学习内容' : 'Create study content'} showAiCredits={false}
      titleAccessory={<LearningIconButton icon="help-circle-outline" variant="plain" label={zh ? '操作说明' : 'How this works'} onPress={() => { Keyboard.dismiss(); help.current?.present(); }} />}
      backAction={mutation.isPending ? () => {} : back} />
    <ScrollView ref={scroll} key={`${step}-${mutation.isSuccess}`} scrollEnabled={!dragging && !mutation.isPending}
      pointerEvents={mutation.isPending ? 'none' : 'auto'} importantForAccessibility={mutation.isPending ? 'no-hide-descendants' : 'auto'}
      keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      {mutation.data ? <View style={s.card}>
        <Text style={s.title}>{mutation.data.readyToLearn ? (zh ? '学习内容已保存' : 'Study content saved') : (zh ? '草稿已暂存' : 'Draft saved')}</Text>
        <Text style={s.small}>{zh ? `${units.length} 个单元 · ${mutation.data.studyItemCount} 张卡片 · 仅自己可见` : `${units.length} units · ${mutation.data.studyItemCount} cards · Private`}</Text>
        {mutation.data.readyToLearn ? <LearningButton label={zh ? '开始学习' : 'Start learning'} onPress={() => router.replace(`/education/my-courses/${mutation.data.courseId}?start=1` as Href)} /> : <LearningButton label={zh ? '继续编辑' : 'Keep editing'} onPress={() => { mutation.reset(); setStep(1); }} />}
        <LearningButton secondary label={zh ? '我的学习内容' : 'My study content'} onPress={() => router.replace('/education/my-courses' as Href)} />
      </View> : <>
        <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
          {(zh ? ['基本信息', '添加词语', '预览'] : ['Basics', 'Add words', 'Preview']).map((label, index) => <View key={label} style={[s.row, { flex: 1, gap: 4 }]}>
            <Text style={[s.badge, index <= step && { backgroundColor: theme.violetDeep, color: theme.onAccent }]}>{index < step ? '✓' : index + 1}</Text>
            <Text style={[s.small, { flexShrink: 1 }, index === step && { color: theme.violetDeep }]}>{label}</Text>
            {index < 2 ? <View style={{ flex: 1, height: 2, backgroundColor: index < step ? theme.violetDeep : theme.line }} /> : null}
          </View>)}
        </View>
        {step === 0 ? <LearningDraftBasics title={title} language={language} mode={mode} onTitle={setTitle} onLanguage={setLanguage} onMode={setMode} /> : <>
          <View style={[s.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}><Text style={[s.title, { flexShrink: 1 }]}>{title}</Text><Text style={s.small}>{zh ? `${units.length} 个单元 · ${total} 个词` : `${units.length} units · ${total} words`}</Text></View>
          {step === 1 ? <LearningDraftUnits units={units} inputs={inputs} mode={mode} activeId={activeId || units[0].id}
            onReveal={offset => requestAnimationFrame(() => scroll.current?.scrollTo({ y: Math.max(0, offset - 12), animated: false }))}
            onInput={(id, value) => { setInputs(previous => ({ ...previous, [id]: value })); setNotice(''); }} onAdd={add} onScan={scan}
            onRename={(id, value) => setUnits(previous => previous.map(unit => unit.id === id ? { ...unit, title: value } : unit))}
            onWord={openWord} onNew={addUnit} onRemove={setRemoveUnit} /> : <>
            <View style={s.note}><Text style={s.chipText}>{zh ? '学习顺序' : 'Study order'}</Text><Text style={s.small}>{zh ? '按单元顺序学习。长按单元调整顺序，或使用上下箭头。' : 'Study units in order. Hold a unit to reorder, or use the arrows.'}</Text></View>
            {units.map((unit, index) => <LearningDraftPreviewUnit key={unit.id} unit={unit} index={index} count={units.length} onDrag={setDragging}
              onEdit={() => { setActiveId(unit.id); setStep(1); }} onMove={(from, to) => setUnits(previous => reorderItems(previous, from, to))} />)}
            <AnimatedPressable accessibilityRole="button" style={s.dashed} onPress={() => { addUnit(); setStep(1); }}><Text style={s.chipText}>＋ {zh ? '再加一个单元' : 'Add another unit'}</Text></AnimatedPressable>
            <Text style={s.small}>{zh ? '仅自己可见，保存后就能开始学。' : 'Private to you. Start learning as soon as you save.'}</Text>
          </>}
        </>}
      </>}
      {draft.isError ? <Text accessibilityRole="alert" style={s.error}>{zh ? '草稿加载失败，请返回后重试。' : 'Could not load the draft. Go back and retry.'}</Text> : null}
      {notice ? <Text accessibilityRole="alert" style={s.error}>{notice}</Text> : null}
      {mutation.isError ? <Text accessibilityRole="alert" style={s.error}>{educationDraftSaveError(mutation.error, zh)}</Text> : null}
    </ScrollView>
    {!mutation.data ? <View style={[common.dock, { paddingBottom: Math.max(12, insets.bottom), gap: 8 }]}>
      {step > 0 ? <Text style={[s.small, { textAlign: 'center' }]}>{zh ? `${total} 个词 · ${units.length} 个单元` : `${total} words · ${units.length} units`}</Text> : <Text style={[s.small, { textAlign: 'center' }]}>{zh ? '下一步开始添加词语' : 'Next, add your words'}</Text>}
      {step === 2 ? <AnimatedPressable accessibilityRole="button" disabled={mutation.isPending || !draftUnitsReady(units)}
        onPress={() => save(false)} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={s.small}>{zh ? '暂存草稿，稍后再学' : 'Save a draft for later'}</Text></AnimatedPressable> : null}
      <LearningButton loading={mutation.isPending} disabled={draft.isLoading || !title.trim() || (step === 2 && !draftUnitsReady(units))}
        label={step === 0 ? (zh ? '继续' : 'Continue') : step === 1 ? (zh ? '下一步：预览' : 'Next: preview') : (zh ? '保存并开始学习' : 'Save and start learning')} onPress={next} />
    </View> : null}
    <LearningContentHelpSheet ref={help} onClose={() => help.current?.dismiss()} />
    <LearningDraftWordSheet ref={wordSheet} word={editing} units={units} error={wordError} onChange={word => { setEditing(word); setWordError(''); }}
      onNewUnit={() => { const id = addUnit(); if (id && editing) setEditing({ ...editing, unitId: id }); }}
      onSave={() => { if (!editing) return; const changed = changeDraftWord(units, editing.id, editing.unitId, editing.text, editing.meaning); if (!changed) { setWordError(errorText); return; } setUnits(changed); wordSheet.current?.dismiss(); }}
      onDelete={() => { if (!editing) return; setUnits(previous => previous.map(unit => ({ ...unit, words: unit.words.filter(word => word.id !== editing.id) }))); wordSheet.current?.dismiss(); }} />
    <ConfirmModal visible={!!removeUnit} title={zh ? '删除这个单元？' : 'Delete this unit?'} description={zh ? '里面的词语也会删除。' : 'Its words will also be removed.'}
      destructive confirmText={zh ? '删除' : 'Delete'} cancelText={zh ? '保留' : 'Keep'} onCancel={() => setRemoveUnit(null)} onConfirm={() => { setUnits(previous => previous.filter(unit => unit.id !== removeUnit)); setInputs(previous => { const next = { ...previous }; delete next[removeUnit!]; return next; }); setRemoveUnit(null); }} />
    <ConfirmModal visible={!!pendingExit && !discardConfirmed} title={zh ? '离开未保存的内容？' : 'Leave without saving?'}
      description={zh ? '这次输入还没有保存。' : 'Your changes have not been saved.'} confirmText={zh ? '放弃并离开' : 'Discard and leave'} cancelText={zh ? '继续编辑' : 'Keep editing'}
      destructive onCancel={() => setPendingExit(null)} onConfirm={() => setDiscardConfirmed(true)} />
  </KeyboardAvoidingView>;
}
