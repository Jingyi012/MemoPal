import AnimatedPressable from '@/components/AnimatedPressable';
import { AppImage } from '@/components/AppImage';
import { CommonHeader } from '@/components/CommonHeader';
import LoadingView from '@/components/LoadingView';
import { ModuleNoticeCard } from '@/components/ModuleNoticeCard';
import { RecallAnswerCard } from '@/components/RecallAnswerCard';
import { RecallResultCard } from '@/components/RecallResultCard';
import { PalaceFocusCard } from '@/features/palace-scenes/components/PalaceFocusCard';
import { PalaceOrderedList } from '@/features/palace-scenes/components/PalaceOrderedList';
import { useMemorySet } from '@/features/memory-sets';
import { numberPegTheme as theme } from '@/features/number-peg/constants/numberPegTheme';
import { typography } from '@/theme/typography';
import { usePalaceScene } from '@/features/palace-scenes/hooks/usePalaceScenes';
import {
  clearPalaceSession,
  readPalaceSession,
  writePalaceSession,
} from '@/features/palace-scenes/services/palaceSessionRecovery';
import {
  getSpellingHint,
  normalizeRecallAnswer,
  upsertRecallResponse,
  useCreatePracticeAttempt,
  type PracticeAttemptInput,
  type PracticeResponseInput,
} from '@/features/practice-attempts';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Footprints, List, MapPinned, Sparkles, Target } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type SessionMode = 'browse' | 'walk' | 'list' | 'recall';
type Feedback = 'correct' | 'wrong' | null;

export default function PalaceMemorySessionScreen({
  memorySetId,
  restart = false,
  startInRecall = false,
}: {
  memorySetId: string;
  restart?: boolean;
  startInRecall?: boolean;
}) {
  const router = useRouter();
  const memorySetQuery = useMemorySet(memorySetId);
  const sceneId = memorySetQuery.data?.techniquePlan?.palaceSceneId ?? '';
  const sceneQuery = usePalaceScene(sceneId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<SessionMode>(startInRecall ? 'recall' : 'browse');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [clientAttemptId, setClientAttemptId] = useState(() => Crypto.randomUUID());
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [startedAtMs, setStartedAtMs] = useState(() => Date.now());
  const [questionStartedAtMs, setQuestionStartedAtMs] = useState(() => Date.now());
  const [responses, setResponses] = useState<PracticeResponseInput[]>([]);
  const [lastPayload, setLastPayload] = useState<PracticeAttemptInput | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const hydratedSessionRef = useRef<string | null>(null);
  const sessionReadyRef = useRef(false);
  const practiceAttempt = useCreatePracticeAttempt();

  useEffect(() => {
    const memorySet = memorySetQuery.data;
    if (!memorySet) return;

    const sessionKey = `${memorySet.id}:${memorySet.version}`;
    if (hydratedSessionRef.current === sessionKey) return;

    hydratedSessionRef.current = sessionKey;
    sessionReadyRef.current = false;
    void readPalaceSession(memorySet.id).then((snapshot) => {
      if (restart) {
        if (snapshot) void clearPalaceSession(memorySet.id);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        return;
      }

      if (!snapshot || snapshot.memorySetVersion !== memorySet.version || snapshot.activeIndex > memorySet.items.length) {
        if (snapshot) void clearPalaceSession(memorySet.id);
        sessionReadyRef.current = true;
        return;
      }

      if (startInRecall && snapshot.mode !== 'recall') {
        void clearPalaceSession(memorySet.id);
        setMode('recall');
        setActiveIndex(0);
        setAnswer('');
        setFeedback(null);
        setScore(0);
        setClientAttemptId(Crypto.randomUUID());
        setStartedAt(new Date().toISOString());
        setStartedAtMs(Date.now());
        setQuestionStartedAtMs(Date.now());
        setResponses([]);
        setLastPayload(null);
        setHasRestoredSession(false);
        sessionReadyRef.current = true;
        return;
      }

      setMode(snapshot.mode);
      setActiveIndex(snapshot.activeIndex);
      setScore(snapshot.score);
      setClientAttemptId(snapshot.clientAttemptId);
      setStartedAt(snapshot.startedAt);
      setStartedAtMs(snapshot.startedAtMs);
      setQuestionStartedAtMs(snapshot.questionStartedAtMs);
      setResponses(snapshot.responses);
      setHasRestoredSession(true);
      sessionReadyRef.current = true;
    });
  }, [memorySetQuery.data, restart, startInRecall]);

  useEffect(() => {
    const memorySet = memorySetQuery.data;
    if (!memorySet || !sessionReadyRef.current || hydratedSessionRef.current !== `${memorySet.id}:${memorySet.version}`) return;

    if (activeIndex >= memorySet.items.length) {
      void clearPalaceSession(memorySet.id);
      return;
    }

    void writePalaceSession({
      memorySetId: memorySet.id,
      memorySetVersion: memorySet.version,
      mode,
      activeIndex,
      score,
      clientAttemptId,
      startedAt,
      startedAtMs,
      questionStartedAtMs,
      responses,
      savedAt: new Date().toISOString(),
    });
  }, [activeIndex, clientAttemptId, memorySetQuery.data, mode, questionStartedAtMs, responses, score, startedAt, startedAtMs]);

  const placements = useMemo(() => {
    const memorySet = memorySetQuery.data;
    const scene = sceneQuery.data;
    if (!memorySet || !scene) return [];
    const bindings = memorySet.techniquePlan?.palaceBindings ?? [];
    return memorySet.items.map((item) => {
      const binding = bindings.find((candidate) => candidate.memoryItemId === item.id);
      return { item, binding, locus: scene.loci.find((locus) => locus.id === binding?.locusId) };
    });
  }, [memorySetQuery.data, sceneQuery.data]);

  if (memorySetQuery.isLoading || (sceneId && sceneQuery.isLoading)) {
    return <LoadingView description="Opening your Palace…" />;
  }

  if (!memorySetQuery.data || !sceneQuery.data) {
    return (
      <View style={styles.page}>
        <CommonHeader title="Memory Palace" description="Scene unavailable" backAction={() => router.back()} />
        <View style={styles.empty}>
          <ModuleNoticeCard
            emoji="🏚️"
            title="This Palace could not open"
            body="Refresh your connection or choose another memory."
            onAction={() => void Promise.allSettled([memorySetQuery.refetch(), sceneQuery.refetch()])}
          />
        </View>
      </View>
    );
  }

  const memorySet = memorySetQuery.data;
  const scene = sceneQuery.data;
  const isSpelling = memorySet.goalType === 'spelling';
  const active = placements[activeIndex];
  const recallComplete = mode === 'recall' && activeIndex >= placements.length;

  const startRecall = () => {
    setMode('recall');
    setActiveIndex(0);
    setAnswer('');
    setFeedback(null);
    setScore(0);
    setClientAttemptId(Crypto.randomUUID());
    setStartedAt(new Date().toISOString());
    setStartedAtMs(Date.now());
    setQuestionStartedAtMs(Date.now());
    setResponses([]);
    setLastPayload(null);
    practiceAttempt.reset();
  };

  const checkOrContinue = () => {
    if (!active) return;
    if (feedback) {
      if (feedback === 'wrong') {
        setFeedback(null);
        setAnswer('');
        setQuestionStartedAtMs(Date.now());
        return;
      }
      if (activeIndex === placements.length - 1) {
        const payload: PracticeAttemptInput = {
          clientAttemptId,
          memorySetId: memorySet.id,
          mode: 'recall',
          startedAt,
          durationMs: Math.max(0, Date.now() - startedAtMs),
          responses,
        };
        setLastPayload(payload);
        practiceAttempt.mutate(payload);
      }
      setActiveIndex((value) => value + 1);
      setAnswer('');
      setFeedback(null);
      setQuestionStartedAtMs(Date.now());
      return;
    }

    if (!answer.trim()) return;
    const isCorrect = normalizeRecallAnswer(answer) === normalizeRecallAnswer(active.item.answer);
    setResponses((current) => upsertRecallResponse(
      current,
      active.item.id,
      isCorrect,
      Math.max(0, Date.now() - questionStartedAtMs),
    ));
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      setScore((value) => value + 1);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  return (
    <View style={styles.page}>
      <CommonHeader
        eyebrow="Memory Palace"
        title={memorySet.title}
        description={`${scene.name} · ${placements.length} loci`}
        backAction={() => router.back()}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {mode !== 'list' ? (
          <>
            <View style={styles.canvas}>
              <AppImage imageUrl={scene.imageUrl} style={StyleSheet.absoluteFillObject} />
              {placements.map((placement, index) =>
                placement.locus ? (
                  <AnimatedPressable
                    key={placement.item.id}
                    accessibilityLabel={`Locus ${index + 1}: ${placement.locus.name}`}
                    onPress={() => mode === 'browse' && setActiveIndex(index)}
                    style={[
                      styles.marker,
                      { left: `${placement.locus.xPercent}%`, top: `${placement.locus.yPercent}%` },
                      index === activeIndex && styles.activeMarker,
                    ]}>
                    <Text style={styles.markerText}>{index + 1}</Text>
                  </AnimatedPressable>
                ) : null
              )}
            </View>
            <Text style={styles.hint}>
              {mode === 'recall' ? 'Use the active locus as your cue.' : 'Tap a marker, or walk through every locus in order.'}
            </Text>
          </>
        ) : null}
        {hasRestoredSession ? (
          <AnimatedPressable onPress={() => setHasRestoredSession(false)} style={styles.restoreNotice}>
            <Text style={styles.restoreNoticeText}>Welcome back — your Palace session was restored.</Text>
          </AnimatedPressable>
        ) : null}

        <View style={styles.modeRail}>
          <AnimatedPressable
            accessibilityLabel="Open Palace map"
            accessibilityState={{ selected: mode === 'browse' }}
            onPress={() => { setMode('browse'); setActiveIndex(0); setFeedback(null); setAnswer(''); }}
            style={[styles.modeTab, mode === 'browse' && styles.modeTabActive]}>
            <MapPinned size={16} color={mode === 'browse' ? theme.violetDeep : theme.inkSoft} />
            <Text style={[styles.modeTabText, mode === 'browse' && styles.modeTabTextActive]}>Map</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Start Palace walk"
            accessibilityState={{ selected: mode === 'walk' }}
            onPress={() => { setMode('walk'); setActiveIndex(0); setFeedback(null); setAnswer(''); }}
            style={[styles.modeTab, mode === 'walk' && styles.modeTabActive]}>
            <Footprints size={16} color={mode === 'walk' ? theme.violetDeep : theme.inkSoft} />
            <Text style={[styles.modeTabText, mode === 'walk' && styles.modeTabTextActive]}>Walk</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Open Palace ordered list"
            accessibilityState={{ selected: mode === 'list' }}
            onPress={() => { setMode('list'); setActiveIndex(0); setFeedback(null); setAnswer(''); }}
            style={[styles.modeTab, mode === 'list' && styles.modeTabActive]}>
            <List size={16} color={mode === 'list' ? theme.violetDeep : theme.inkSoft} />
            <Text style={[styles.modeTabText, mode === 'list' && styles.modeTabTextActive]}>List</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Open Palace recall"
            accessibilityState={{ selected: mode === 'recall' }}
            onPress={startRecall}
            style={[styles.modeTab, mode === 'recall' && styles.modeTabActive]}>
            <Target size={16} color={mode === 'recall' ? theme.violetDeep : theme.inkSoft} />
            <Text style={[styles.modeTabText, mode === 'recall' && styles.modeTabTextActive]}>Recall</Text>
          </AnimatedPressable>
        </View>

        {mode === 'browse' && active ? (
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={styles.previewIcon}>
                <Sparkles size={18} color={theme.violetDeep} />
              </View>
              <View style={styles.previewCopy}>
                <Text style={styles.eyebrow}>LOCUS {activeIndex + 1} · {active.locus?.name?.toUpperCase() ?? 'MEMORY SPOT'}</Text>
                <Text style={styles.previewAnswer}>{active.item.answer}</Text>
              </View>
            </View>
            <Text style={styles.previewAssociation}>
              {active.binding?.associationText ?? 'This is the memory attached to this spot.'}
            </Text>
          </View>
        ) : null}

        {mode === 'walk' && active ? (
          active.locus ? (
            <PalaceFocusCard
              answer={active.item.answer}
              association={active.binding?.associationText}
              index={activeIndex}
              isLast={activeIndex === placements.length - 1}
              locus={active.locus}
              onPrevious={() => setActiveIndex((value) => Math.max(0, value - 1))}
              onNext={() =>
                activeIndex === placements.length - 1
                  ? setActiveIndex(0)
                  : setActiveIndex((value) => value + 1)
              }
              onStartRecall={startRecall}
              scene={scene}
              total={placements.length}
            />
          ) : null
        ) : mode === 'recall' ? (
          recallComplete ? (
            <RecallResultCard
              tone="palace"
              title="Palace recalled!"
              score={score}
              total={placements.length}
              body={score === placements.length
                ? 'Every locus led you to the right memory.'
                : 'Walk through the missed loci once more, then try another round.'}
              saveStatus={
                practiceAttempt.isPending ? (
                  <Text style={styles.saveState}>Saving your progress…</Text>
                ) : practiceAttempt.isError ? (
                  <View style={styles.saveError}>
                    <Text style={styles.saveErrorText}>Progress was not saved. Your result is still here.</Text>
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityLabel="Retry saving progress"
                      onPress={() => lastPayload && practiceAttempt.mutate(lastPayload)}
                      style={styles.retrySaveButton}>
                      <Text style={styles.retrySaveText}>Retry save</Text>
                    </AnimatedPressable>
                  </View>
                ) : practiceAttempt.data ? (
                  <Text style={styles.saveSuccess}>
                    Saved ✓ Next review {practiceAttempt.data.nextReviewAt ? new Date(practiceAttempt.data.nextReviewAt).toLocaleString() : 'will appear in Today'}
                  </Text>
                ) : null
              }
              onRetry={startRecall}
              secondaryAction={{ label: 'Walk the Palace again', onPress: () => { setMode('walk'); setActiveIndex(0); } }}
              onReturnToToday={() => router.replace('/(tabs)')}
            />
          ) : active ? (
            <RecallAnswerCard
              tone="palace"
              icon={<Target size={23} color={theme.violetDeep} />}
              eyebrow={`LOCUS ${activeIndex + 1} · ${active.locus?.name?.toUpperCase() ?? 'MEMORY SPOT'}`}
              prompt="What did you place here?"
              answer={answer}
              feedback={feedback}
              feedbackText={feedback === 'correct'
                ? 'That is it!'
                : isSpelling
                  ? `Check the spelling: ${getSpellingHint(active.item.answer, answer)}`
                  : `It was ${active.item.answer}. See it at this locus once more, then try again.`}
              actionLabel={feedback === 'wrong' ? 'Try this locus again' : feedback ? 'Next locus' : 'Check answer'}
              scoreLabel={`Locus ${activeIndex + 1} / ${placements.length} · Score ${score}`}
              onAnswerChange={setAnswer}
              onSubmit={checkOrContinue}
            />
          ) : null
        ) : mode === 'list' ? (
          <PalaceOrderedList
            activeIndex={activeIndex}
            items={placements.map((placement) => ({
              id: placement.item.id,
              answer: placement.item.answer,
              association: placement.binding?.associationText,
              locusName: placement.locus?.name,
            }))}
            onSelect={setActiveIndex}
          />
        ) : (
          <>
            {placements.map((placement, index) => (
              <AnimatedPressable
                key={placement.item.id}
                onPress={() => setActiveIndex(index)}
                style={[styles.itemRow, index === activeIndex && styles.activeRow]}>
                <View style={styles.itemNumber}><Text style={styles.itemNumberText}>{index + 1}</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.itemAnswer}>{placement.item.answer}</Text>
                  <Text style={styles.itemLocus}>{placement.locus?.name}</Text>
                </View>
              </AnimatedPressable>
            ))}
            <AnimatedPressable
              onPress={() => { setActiveIndex(0); setMode('walk'); }}
              style={styles.primaryButton}>
              <Text style={styles.primaryText}>🚶 Walk through my Palace</Text>
            </AnimatedPressable>
            <AnimatedPressable onPress={startRecall} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Start recall challenge</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 16, paddingBottom: 42 },
  flex: { flex: 1 },
  canvas: { height: 300, borderRadius: 23, overflow: 'hidden', borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#EAE5D8' },
  marker: { position: 'absolute', width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, backgroundColor: '#9B8CFF', borderWidth: 3, borderColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  activeMarker: { backgroundColor: theme.sunDeep, transform: [{ scale: 1.18 }] },
  markerText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 12 },
  hint: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 11, lineHeight: 17, textAlign: 'center', marginVertical: 12 },
  restoreNotice: { marginBottom: 10, borderRadius: 12, backgroundColor: '#E3F6ED', borderWidth: 1.5, borderColor: '#BFE7D6', paddingHorizontal: 12, paddingVertical: 9 },
  restoreNoticeText: { color: '#247B67', fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  modeRail: { flexDirection: 'row', gap: 7, padding: 5, borderRadius: 17, backgroundColor: '#EEE9FF', marginBottom: 12 },
  modeTab: { flex: 1, minHeight: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modeTabActive: { backgroundColor: 'white', shadowColor: theme.ink, shadowOpacity: 0.08, shadowRadius: 5, elevation: 1 },
  modeTabText: { color: theme.inkSoft, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  modeTabTextActive: { color: theme.violetDeep },
  previewCard: { borderRadius: 20, borderWidth: 2, borderColor: '#DCD4FF', backgroundColor: '#F7F5FF', padding: 14, marginBottom: 12 },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center' },
  previewCopy: { flex: 1 },
  eyebrow: { color: '#7A68E0', fontFamily: typography.bodyExtraBold, fontSize: 10, letterSpacing: 0.8 },
  previewAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 19, marginTop: 4 },
  previewAssociation: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, marginTop: 10 },
  itemRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 15, borderWidth: 2, borderColor: theme.line, backgroundColor: theme.paper, padding: 10, marginBottom: 8 },
  activeRow: { borderColor: '#9B8CFF', backgroundColor: '#F7F5FF' },
  itemNumber: { width: 29, height: 29, borderRadius: 15, backgroundColor: '#9B8CFF', alignItems: 'center', justifyContent: 'center' },
  itemNumberText: { color: 'white', fontFamily: typography.bodyExtraBold, fontSize: 11 },
  itemAnswer: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14 },
  itemLocus: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 10, marginTop: 2 },
  primaryButton: { width: '100%', minHeight: 53, borderRadius: 16, backgroundColor: theme.sun, alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 16, shadowColor: theme.sunDeep, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 },
  primaryText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 14, textAlign: 'center' },
  secondaryButton: { width: '100%', minHeight: 49, borderRadius: 16, borderWidth: 2, borderColor: '#9B8CFF', backgroundColor: '#F7F5FF', alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 16 },
  secondaryText: { color: '#6654D9', fontFamily: typography.bodyExtraBold, fontSize: 14 },
  saveState: { color: theme.inkSoft, fontFamily: typography.bodyBold, fontSize: 12, marginBottom: 8 },
  saveSuccess: { color: theme.grass, fontFamily: typography.bodyExtraBold, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 8 },
  saveError: { width: '100%', alignItems: 'center', marginBottom: 8 },
  saveErrorText: { color: theme.berryDeep, fontFamily: typography.bodyBold, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retrySaveButton: { marginTop: 8, borderRadius: 12, backgroundColor: '#FFE3EA', paddingHorizontal: 14, paddingVertical: 9 },
  retrySaveText: { color: theme.berryDeep, fontFamily: typography.bodyExtraBold, fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
