import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Text, View } from 'react-native';
import AnimatedPressable from '@/components/AnimatedPressable';
import { ConfirmModal } from '@/components/ConfirmModal';
import type { PhotoResponseAnswer, PhotoResponseQuestion } from '../../types/question.types';
import { useQuestionInputStyles } from './questionInputStyles';
import { HandwritingCanvas } from './HandwritingCanvas';

type PhotoFile = Readonly<{ uri: string; name: string; type: string }>;

export function PhotoResponseInput({ question, value, identity, onUpload, onChange, onLocalPreview, onWorkChange, labels, disabled = false, expired = false }: {
  question: PhotoResponseQuestion;
  value: PhotoResponseAnswer;
  identity: string;
  onUpload: (file: PhotoFile) => Promise<string>;
  onChange: (answer: PhotoResponseAnswer) => void;
  onLocalPreview: (uri: string, cleanup: () => void) => void;
  onWorkChange: (hasUnsavedWork: boolean, processing: boolean) => void;
  labels: Readonly<{
    promptHint: string; hint: string; choose: string; attached: string; uploading: string; uploadError: string;
    openCanvas: string; grid: string; gridEnabled: string; undo: string; clear: string; saveDrawing: string;
    savingDrawing: string; discardDrawing: string; retryDrawing: string; drawingUploadError: string;
    drawingSaved: string; replaceTitle: string; replaceBody: string; replaceConfirm: string; cancel: string;
    discardBeforeReplace: string; handwritingLimit: string;
  }>;
  disabled?: boolean;
  expired?: boolean;
}) {
  const { styles } = useQuestionInputStyles();
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [canvasHasWork, setCanvasHasWork] = useState(false);
  const [replacement, setReplacement] = useState<PhotoFile | null>(null);
  const epochRef = useRef(0);
  const identityRef = useRef(identity);
  const expiredRef = useRef(expired);
  const photoOperationRef = useRef(false);
  const canvasWorkRef = useRef(false);
  const canvasProcessingRef = useRef(false);
  identityRef.current = identity;
  expiredRef.current = expired;

  const publishWork = useCallback(() => {
    onWorkChange(canvasWorkRef.current || photoOperationRef.current,
      canvasProcessingRef.current || photoOperationRef.current);
  }, [onWorkChange]);

  useEffect(() => {
    invalidateEpoch(epochRef);
    photoOperationRef.current = false;
    canvasWorkRef.current = false;
    canvasProcessingRef.current = false;
    setCanvasHasWork(false);
    setUploading(false);
    publishWork();
    return () => {
      invalidateEpoch(epochRef);
      photoOperationRef.current = false;
      canvasWorkRef.current = false;
      canvasProcessingRef.current = false;
      onWorkChange(false, false);
    };
  }, [identity, onWorkChange, publishWork]);

  useEffect(() => {
    if (!expired) return;
    setConfirmReplace(false);
    setReplacement(null);
  }, [expired]);

  const handleCanvasWorkChange = useCallback((hasWork: boolean, processing: boolean) => {
    canvasWorkRef.current = hasWork;
    canvasProcessingRef.current = processing;
    setCanvasHasWork(hasWork);
    publishWork();
  }, [publishWork]);

  const beginPhotoOperation = () => {
    if (photoOperationRef.current) return false;
    photoOperationRef.current = true;
    setUploading(true);
    setFailed(false);
    publishWork();
    return true;
  };

  const finishPhotoOperation = () => {
    photoOperationRef.current = false;
    setUploading(false);
    publishWork();
  };

  const uploadPhotoLocked = async (file: PhotoFile, requestEpoch: number) => {
    try {
      const photoAttachmentId = await onUpload(file);
      if (requestEpoch === epochRef.current && identityRef.current === identity && !expiredRef.current) {
        onChange({ type: 'photo-response', photoAttachmentId, localUri: file.uri });
      }
    } catch { if (requestEpoch === epochRef.current) setFailed(true); }
    finally { if (requestEpoch === epochRef.current) finishPhotoOperation(); }
  };

  const selectPhoto = async () => {
    if (disabled || expiredRef.current || canvasWorkRef.current || !beginPhotoOperation()) return;
    const requestEpoch = epochRef.current;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.9 });
      if (result.canceled || !result.assets[0] || requestEpoch !== epochRef.current || identityRef.current !== identity || expiredRef.current) return;
      const asset = result.assets[0];
      const name = asset.fileName ?? asset.uri.split('/').pop() ?? 'response.jpg';
      const type = asset.mimeType ?? (name.toLowerCase().endsWith('.png') ? 'image/png' : name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');
      const file = { uri: asset.uri, name, type };
      if (value.photoAttachmentId) {
        setReplacement(file);
        setConfirmReplace(true);
        return;
      }
      await uploadPhotoLocked(file, requestEpoch);
    } catch {
      if (requestEpoch === epochRef.current) setFailed(true);
    } finally {
      if (requestEpoch === epochRef.current && photoOperationRef.current) finishPhotoOperation();
    }
  };

  const confirmPhotoReplacement = async () => {
    setConfirmReplace(false);
    const file = replacement;
    setReplacement(null);
    if (!file || disabled || expiredRef.current || !beginPhotoOperation()) return;
    await uploadPhotoLocked(file, epochRef.current);
  };

  return <View style={styles.container}>
    <Text style={styles.prompt}>{question.prompt}</Text>
    <Text style={styles.hint}>{labels.promptHint}</Text>
    <Text style={styles.hint}>{labels.hint}</Text>
    {canvasHasWork ? <Text style={styles.hint}>{labels.discardBeforeReplace}</Text> : null}
    {value.localUri ? <Image accessibilityLabel={question.prompt} source={{ uri: value.localUri }} style={{ width: '100%', height: 220, borderRadius: 12, backgroundColor: '#FFFFFF' }} resizeMode="contain" /> : null}
    {value.photoAttachmentId && !value.localUri ? <Text style={styles.hint}>{labels.attached}</Text> : null}
    {failed ? <Text accessibilityRole="alert" style={styles.hint}>{labels.uploadError}</Text> : null}
    <AnimatedPressable accessibilityRole="button" accessibilityLabel={labels.choose}
      disabled={disabled || expired || uploading || canvasHasWork}
      onPress={() => void selectPhoto()} style={[styles.option, (disabled || expired || uploading || canvasHasWork) && styles.optionDisabled]}>
      <Text style={styles.optionLabel}>{uploading ? labels.uploading : labels.choose}</Text>
    </AnimatedPressable>
    <HandwritingCanvas identity={identity} disabled={disabled || uploading} expired={expired} hasExistingAttachment={Boolean(value.photoAttachmentId)}
      onUpload={onUpload} onSaved={(attachmentId, localUri, cleanup) => {
        onLocalPreview(localUri, cleanup);
        onChange({ type: 'photo-response', photoAttachmentId: attachmentId, localUri });
      }}
      onWorkChange={handleCanvasWorkChange}
      labels={{ open: labels.openCanvas, hint: labels.hint, grid: labels.grid, gridEnabled: labels.gridEnabled,
        undo: labels.undo, clear: labels.clear, save: labels.saveDrawing, saving: labels.savingDrawing,
        discard: labels.discardDrawing, close: labels.cancel, retry: labels.retryDrawing, uploadError: labels.drawingUploadError,
        saved: labels.drawingSaved, limit: labels.handwritingLimit, replaceTitle: labels.replaceTitle, replaceBody: labels.replaceBody,
        replaceConfirm: labels.replaceConfirm, cancel: labels.cancel }} />
    <ConfirmModal visible={confirmReplace} title={labels.replaceTitle} description={labels.replaceBody}
      confirmText={labels.replaceConfirm} cancelText={labels.cancel} destructive
      onCancel={() => { setConfirmReplace(false); setReplacement(null); }} onConfirm={() => { void confirmPhotoReplacement(); }} />
  </View>;
}

export type { PhotoFile };

function invalidateEpoch(epochRef: { current: number }) {
  epochRef.current += 1;
}
