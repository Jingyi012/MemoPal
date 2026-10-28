import { createLearningStyles as createThemedStyles, learningTypography as typography } from '@/features/education/theme/learningTheme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { EducationResponseAttachmentFile } from '@/features/education/types/question.types';
import { appendHandwritingPoint, canEditHandwritingDraft, completeHandwritingDraft, createHandwritingDraft, discardHandwritingDraft, expireHandwritingDraft, handwritingHasUnsavedWork, markHandwritingFilePending, resetHandwritingDraftForIdentity, type HandwritingDraft, type HandwritingPoint, type HandwritingStroke } from '@/features/education/utils/educationHandwritingDraft';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import { File, Paths } from 'expo-file-system';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import { useQuestionInputStyles } from './questionInputStyles';

type Props = Readonly<{
  identity: string;
  onUpload: (file: EducationResponseAttachmentFile) => Promise<string>;
  onSaved: (attachmentId: string, localUri: string, cleanup: () => void) => void;
  onWorkChange: (hasUnsavedWork: boolean, processing: boolean) => void;
  labels: Readonly<{
    open: string; hint: string; grid: string; gridEnabled: string; undo: string; clear: string; save: string; saving: string;
    discard: string; close: string; retry: string; uploadError: string; saved: string;
    replaceTitle: string; replaceBody: string; replaceConfirm: string; cancel: string; limit: string;
  }>;
  disabled?: boolean;
  expired?: boolean;
  hasExistingAttachment?: boolean;
}>;

const WIDTH = 360;
const HEIGHT = 260;
const GRID_STEP = 24;
const PNG_MAX_BYTES = 10_000_000;

type PendingPng = EducationResponseAttachmentFile & Readonly<{ cleanup: () => void }>;

export function HandwritingCanvas({ identity, onUpload, onSaved, onWorkChange, labels, disabled = false, expired = false, hasExistingAttachment = false }: Props) {
  const { styles: inputStyles } = useQuestionInputStyles();
  const { styles } = useStyles();
  const captureViewRef = useRef<View>(null);
  const aliveRef = useRef(true);
  const epochRef = useRef(0);
  const draftRef = useRef<HandwritingDraft>(createHandwritingDraft(identity));
  const strokesRef = useRef<readonly HandwritingStroke[]>([]);
  const pendingPngRef = useRef<PendingPng | null>(null);
  const captureRefForCanvasWidth = useRef(1);
  const capturingRef = useRef(false);
  const uploadingRef = useRef(false);
  const activeStrokeAcceptedRef = useRef(false);
  const [draft, setDraft] = useState(draftRef.current);
  const [strokes, setStrokes] = useState<readonly HandwritingStroke[]>([]);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [grid, setGrid] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const expiredRef = useRef(expired);
  expiredRef.current = expired;

  const isProcessing = capturing || uploading;
  const hasUnsavedWork = handwritingHasUnsavedWork(draft, capturing, uploading);
  const busy = disabled || expired || isProcessing;

  const publish = useCallback((nextStrokes: readonly HandwritingStroke[], nextDraft = draftRef.current) => {
    strokesRef.current = nextStrokes;
    draftRef.current = nextDraft;
    setStrokes(nextStrokes);
    setDraft(nextDraft);
    onWorkChange(handwritingHasUnsavedWork(nextDraft, capturingRef.current, uploadingRef.current), capturingRef.current || uploadingRef.current);
  }, [onWorkChange]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      invalidateEpoch(epochRef);
      if (!uploadingRef.current) pendingPngRef.current?.cleanup();
      pendingPngRef.current = null;
      onWorkChange(false, false);
    };
  }, [onWorkChange]);

  useEffect(() => {
    const nextDraft = resetHandwritingDraftForIdentity(draftRef.current, identity);
    if (nextDraft === draftRef.current) return;
    epochRef.current++;
    if (!uploadingRef.current) pendingPngRef.current?.cleanup();
    pendingPngRef.current = null;
    strokesRef.current = [];
    draftRef.current = nextDraft;
    setStrokes([]);
    setDraft(nextDraft);
    setFailed(false);
    setConfirmReplace(false);
    setSaved(false);
    setLocalPreview(null);
    onWorkChange(false, false);
  }, [identity, onWorkChange]);

  const dropDraft = useCallback(() => {
    epochRef.current++;
    if (!uploadingRef.current) pendingPngRef.current?.cleanup();
    pendingPngRef.current = null;
    setCapturing(false);
    setUploading(false);
    capturingRef.current = false;
    uploadingRef.current = false;
    setFailed(false);
    setSaved(false);
    setLocalPreview(null);
    setCanvasOpen(false);
    publish([], discardHandwritingDraft(draftRef.current));
    onWorkChange(false, false);
  }, [onWorkChange, publish]);

  useEffect(() => {
    if (!expired) return;
    epochRef.current++;
    if (!uploadingRef.current) pendingPngRef.current?.cleanup();
    pendingPngRef.current = null;
    capturingRef.current = false;
    uploadingRef.current = false;
    const next = expireHandwritingDraft(draftRef.current);
    publish([], next);
    setCapturing(false);
    setUploading(false);
    setFailed(false);
    setConfirmReplace(false);
    setCanvasOpen(false);
    setLocalPreview(null);
    onWorkChange(false, false);
  }, [expired, onWorkChange, publish]);

  const updatePoint = useCallback((x: number, y: number, start: boolean) => {
    if (disabled || expired || expiredRef.current || !canEditHandwritingDraft(draftRef.current, capturingRef.current, uploadingRef.current)) return false;
    const point: HandwritingPoint = { x: Math.max(0, Math.min(WIDTH, x)), y: Math.max(0, Math.min(HEIGHT, y)) };
    const next = appendHandwritingPoint(strokesRef.current, point, start);
    if (next === strokesRef.current) {
      setLimitReached(true);
      return false;
    }
    if (start) setLimitReached(false);
    publish(next, { ...draftRef.current, strokes: next });
    return true;
  }, [disabled, expired, publish]);

  const gesture = useMemo(() => Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin(event => {
      activeStrokeAcceptedRef.current = updatePoint(event.x * WIDTH / captureRefForCanvasWidth.current, event.y, true);
    })
    .onUpdate(event => {
      if (activeStrokeAcceptedRef.current) updatePoint(event.x * WIDTH / captureRefForCanvasWidth.current, event.y, false);
    })
    .onFinalize(() => { activeStrokeAcceptedRef.current = false; }), [updatePoint]);

  const createPng = async (): Promise<PendingPng> => {
    const node = captureViewRef.current;
    if (!node) throw new Error('Canvas is unavailable.');
    const uri = await captureRef(node, { format: 'png', quality: 1, result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile' });
    let file: PendingPng;
    if (Platform.OS === 'web') {
      const dataUrl = uri;
      const blob = await (await fetch(dataUrl)).blob();
      if (blob.size > PNG_MAX_BYTES) throw new Error('Canvas image is too large.');
      const objectUri = URL.createObjectURL(blob);
      file = { uri: objectUri, name: 'written-response.png', type: 'image/png', cleanup: () => URL.revokeObjectURL(objectUri) };
    } else {
      try {
        const captured = new File(uri);
        const bytes = await captured.bytes();
        if (bytes.byteLength > PNG_MAX_BYTES) throw new Error('Canvas image is too large.');
        const target = new File(Paths.cache, `education-writing-${Date.now()}-${Math.random().toString(16).slice(2)}.png`);
        try { target.write(bytes); }
        catch (error) {
          if (target.exists) target.delete();
          throw error;
        }
        file = { uri: target.uri, name: target.name, type: 'image/png', cleanup: () => { if (target.exists) target.delete(); } };
      } finally {
        releaseCapture(uri);
      }
    }
    return file;
  };

  const saveDrawing = async () => {
    if (disabled || expired || expiredRef.current || draftRef.current.expired || capturingRef.current || uploadingRef.current || (strokesRef.current.length === 0 && !pendingPngRef.current)) return;
    const requestEpoch = epochRef.current;
    setFailed(false);
    setCapturing(true);
    capturingRef.current = true;
    onWorkChange(true, true);
    let activeFile: PendingPng | null = null;
    try {
      let file = pendingPngRef.current;
      if (!file) {
        file = await createPng();
        activeFile = file;
        if (!aliveRef.current || requestEpoch !== epochRef.current || expiredRef.current || draftRef.current.expired) {
          file.cleanup();
          return;
        }
        pendingPngRef.current = file;
        draftRef.current = markHandwritingFilePending(draftRef.current);
        setDraft(draftRef.current);
      }
      activeFile = file;
      setCapturing(false);
      capturingRef.current = false;
      setUploading(true);
      uploadingRef.current = true;
      onWorkChange(true, true);
      const attachmentId = await onUpload(file);
      if (!aliveRef.current || requestEpoch !== epochRef.current || expiredRef.current || draftRef.current.expired) {
        file.cleanup();
        if (pendingPngRef.current === file) pendingPngRef.current = null;
        return;
      }
      setLocalPreview(file.uri);
      setSaved(true);
      setFailed(false);
      strokesRef.current = [];
      const cleanDraft = completeHandwritingDraft(draftRef.current);
      draftRef.current = cleanDraft;
      setDraft(cleanDraft);
      setStrokes([]);
      pendingPngRef.current = null;
      onSaved(attachmentId, file.uri, file.cleanup);
      onWorkChange(false, false);
    } catch {
      if (aliveRef.current && requestEpoch === epochRef.current && !draftRef.current.expired) setFailed(true);
      else {
        activeFile?.cleanup();
        pendingPngRef.current = null;
      }
    } finally {
      if (aliveRef.current && requestEpoch === epochRef.current) {
        setCapturing(false);
        setUploading(false);
        capturingRef.current = false;
        uploadingRef.current = false;
        onWorkChange(Boolean(draftRef.current.strokes.length || pendingPngRef.current), false);
      }
    }
  };

  const currentStrokes = strokes;
  const onCanvasLayout = (event: LayoutChangeEvent) => {
    captureRefForCanvasWidth.current = Math.max(1, event.nativeEvent.layout.width);
  };
  return <View style={inputStyles.container}>
    <Text style={inputStyles.hint}>{labels.hint}</Text>
    <AnimatedPressable accessibilityRole="button" disabled={disabled || expired || canvasOpen && hasUnsavedWork} onPress={() => setCanvasOpen(value => !value)} style={[styles.action, styles.toggle, (disabled || expired || canvasOpen && hasUnsavedWork) && styles.disabled]}>
      <Text style={styles.actionText}>{canvasOpen ? labels.close : labels.open}</Text>
    </AnimatedPressable>
    {canvasOpen ? <>
      <View style={styles.canvasFrame}>
        <GestureDetector gesture={gesture}>
          <View ref={captureViewRef} collapsable={false} style={styles.canvasTouch} onLayout={onCanvasLayout}>
            <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" style={styles.svg}>
              <Path d={`M0 0 H${WIDTH} V${HEIGHT} H0 Z`} fill="#FFFFFF" />
              {grid ? Array.from({ length: Math.floor(WIDTH / GRID_STEP) + 1 }, (_, index) => <Line key={`v${index}`} x1={index * GRID_STEP} y1="0" x2={index * GRID_STEP} y2={HEIGHT} stroke="#E8EDF4" strokeWidth="0.7" />) : null}
              {grid ? Array.from({ length: Math.floor(HEIGHT / GRID_STEP) + 1 }, (_, index) => <Line key={`h${index}`} x1="0" y1={index * GRID_STEP} x2={WIDTH} y2={index * GRID_STEP} stroke="#E8EDF4" strokeWidth="0.7" />) : null}
              {currentStrokes.map((stroke, index) => renderStroke(stroke, index))}
            </Svg>
          </View>
        </GestureDetector>
      </View>
      <View style={styles.controls}>
        <Action label={grid ? labels.gridEnabled : labels.grid} disabled={busy || Boolean(pendingPngRef.current)} selected={grid} onPress={() => setGrid(value => !value)} />
        <Action label={labels.undo} disabled={busy || Boolean(pendingPngRef.current) || strokes.length === 0} onPress={() => {
          const next = strokesRef.current.slice(0, -1);
          setLimitReached(false);
          publish(next, { ...draftRef.current, strokes: next });
        }} />
        <Action label={labels.clear} disabled={busy || Boolean(pendingPngRef.current) || strokes.length === 0} onPress={() => {
          setLimitReached(false);
          publish([], { ...draftRef.current, strokes: [] });
        }} />
      </View>
    </> : null}
    {localPreview ? <Image accessibilityLabel={labels.saved} source={{ uri: localPreview }} style={styles.preview} resizeMode="contain" /> : null}
    {saved ? <Text style={inputStyles.hint}>{labels.saved}</Text> : null}
    {failed ? <Text accessibilityRole="alert" style={inputStyles.hint}>{labels.uploadError}</Text> : null}
    {limitReached ? <Text accessibilityRole="alert" style={inputStyles.hint}>{labels.limit}</Text> : null}
    <View style={styles.controls}>
      {canvasOpen ? <Action label={uploading || capturing ? labels.saving : pendingPngRef.current ? labels.retry : labels.save}
        disabled={disabled || expired || isProcessing || strokes.length === 0 && !pendingPngRef.current}
        onPress={() => {
          if (hasExistingAttachment && !pendingPngRef.current) setConfirmReplace(true);
          else void saveDrawing();
        }} primary />
        : null}
      {hasUnsavedWork ? <Action label={labels.discard} disabled={isProcessing} onPress={dropDraft} /> : null}
    </View>
    <ConfirmModal visible={confirmReplace} title={labels.replaceTitle} description={labels.replaceBody}
      confirmText={labels.replaceConfirm} cancelText={labels.cancel} destructive onCancel={() => setConfirmReplace(false)}
      onConfirm={() => { setConfirmReplace(false); void saveDrawing(); }} />
  </View>;
}

function renderStroke(stroke: HandwritingStroke, index: number) {
  if (stroke.length === 1) return <Circle key={`dot-${index}`} cx={stroke[0].x} cy={stroke[0].y} r="2.8" fill="#172033" />;
  const path = stroke.map((point, pointIndex) => `${pointIndex === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  return <Path key={`stroke-${index}`} d={path} fill="none" stroke="#172033" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />;
}

function Action({ label, onPress, disabled, selected = false, primary = false }: { label: string; onPress: () => void; disabled: boolean; selected?: boolean; primary?: boolean }) {
  const { styles } = useStyles();
  return <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress}
    style={[styles.action, primary && styles.primary, selected && styles.selected, disabled && styles.disabled]}>
    <Text style={[styles.actionText, primary && styles.primaryText]}>{label}</Text>
  </AnimatedPressable>;
}

const useStyles = createThemedStyles(theme => StyleSheet.create({
  canvasFrame: { alignSelf: 'stretch', borderColor: theme.line, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  canvasTouch: { backgroundColor: '#FFFFFF', height: HEIGHT, width: '100%' },
  svg: { backgroundColor: '#FFFFFF' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { alignItems: 'center', backgroundColor: theme.paper, borderColor: theme.line, borderRadius: 10, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12 },
  toggle: { alignSelf: 'flex-start' },
  primary: { backgroundColor: theme.violetDeep, borderColor: theme.violetDeep, flexGrow: 1 },
  selected: { backgroundColor: theme.violetTint, borderColor: theme.violetDeep },
  disabled: { opacity: 0.5 },
  actionText: { color: theme.ink, fontFamily: typography.bodyExtraBold, fontSize: 13 },
  primaryText: { color: theme.onAccent },
  preview: { alignSelf: 'stretch', height: 180, backgroundColor: '#FFFFFF', borderRadius: 10 },
}));

function invalidateEpoch(epochRef: { current: number }) {
  epochRef.current += 1;
}
