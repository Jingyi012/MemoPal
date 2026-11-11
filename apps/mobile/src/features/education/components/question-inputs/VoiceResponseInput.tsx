import { AppText as Text } from '@/components/ui/AppText';
import AnimatedPressable from '@/components/AnimatedPressable';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Platform, View } from 'react-native';
import { useEffect, useState } from 'react';
import type { EducationResponseAttachmentFile, VoiceResponseAnswer, VoiceResponseQuestion } from '../../types/question.types';
import { loadEducationVoicePreview, type CachedEducationVoicePreview } from '../../services/educationVoicePreview.service';
import { useQuestionInputStyles } from './questionInputStyles';

export function VoiceResponseInput({ attemptId, question, value, onUpload, onRecordingChange, labels, disabled = false }: {
  attemptId: string;
  question: VoiceResponseQuestion;
  value: VoiceResponseAnswer;
  onUpload: (file: EducationResponseAttachmentFile) => Promise<void>;
  onRecordingChange?: (recording: boolean) => void;
  labels: Readonly<{
    hint: string; record: string; stopAndSave: string; attached: string;
    playRecording: string; pauseRecording: string;
    loadingRecording: string; previewError: string;
    permissionDenied: string; recordingError: string; uploading: string;
  }>;
  disabled?: boolean;
}) {
  const { styles } = useQuestionInputStyles();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [uploading, setUploading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(value.localUri ?? null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewPlayer = useAudioPlayer(previewUri);
  const previewState = useAudioPlayerStatus(previewPlayer);

  useEffect(() => {
    let cancelled = false;
    let preview: CachedEducationVoicePreview | null = null;
    setPreviewFailed(false);
    setLoadingPreview(false);

    if (value.localUri) {
      setPreviewUri(value.localUri);
      return () => undefined;
    }
    if (!value.audioAttachmentId) {
      setPreviewUri(null);
      return () => undefined;
    }

    setPreviewUri(null);
    setLoadingPreview(true);
    void loadEducationVoicePreview(attemptId, question.id, value.audioAttachmentId)
      .then((loaded) => {
        if (cancelled) loaded.cleanup();
        else {
          preview = loaded;
          setPreviewUri(loaded.uri);
        }
      })
      .catch(() => { if (!cancelled) setPreviewFailed(true); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });

    return () => {
      cancelled = true;
      preview?.cleanup();
    };
  }, [attemptId, question.id, value.audioAttachmentId, value.localUri]);

  const startRecording = async () => {
    setPermissionDenied(false);
    setFailed(false);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }
      previewPlayer.pause();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      onRecordingChange?.(true);
    } catch {
      setFailed(true);
      onRecordingChange?.(false);
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    }
  };

  const stopAndUpload = async () => {
    setUploading(true);
    setFailed(false);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (!uri) throw new Error('The recording did not produce a file.');
      const isWeb = Platform.OS === 'web';
      await onUpload({
        uri,
        name: isWeb ? 'voice-response.webm' : 'voice-response.m4a',
        type: isWeb ? 'audio/webm' : 'audio/mp4',
      });
    } catch {
      setFailed(true);
    } finally {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      setUploading(false);
      onRecordingChange?.(false);
    }
  };

  return <View style={styles.container}>
    <Text style={styles.hint}>{labels.hint}</Text>
    {value.audioAttachmentId ? <Text style={styles.hint}>{labels.attached}</Text> : null}
    {loadingPreview ? <Text style={styles.hint}>{labels.loadingRecording}</Text> : null}
    {previewFailed ? <Text accessibilityRole="alert" style={styles.hint}>{labels.previewError}</Text> : null}
    {previewUri ? <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={previewState.playing ? labels.pauseRecording : labels.playRecording}
      accessibilityState={{ disabled: disabled || uploading }}
      disabled={disabled || uploading}
      onPress={() => {
        void (async () => {
          await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
          if (previewState.playing) previewPlayer.pause();
          else {
            if (previewState.didJustFinish) await previewPlayer.seekTo(0);
            previewPlayer.play();
          }
        })().catch(() => setFailed(true));
      }}
      style={[styles.option, (disabled || uploading) && styles.optionDisabled]}>
      <Text style={styles.optionLabel}>{previewState.playing ? labels.pauseRecording : labels.playRecording}</Text>
    </AnimatedPressable> : null}
    {permissionDenied ? <Text accessibilityRole="alert" style={styles.hint}>{labels.permissionDenied}</Text> : null}
    {failed ? <Text accessibilityRole="alert" style={styles.hint}>{labels.recordingError}</Text> : null}
    {recorderState.isRecording ? <Text accessibilityLiveRegion="polite" style={styles.hint}>
      {Math.floor(recorderState.durationMillis / 1000)}s
    </Text> : null}
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={question.prompt}
      accessibilityState={{ disabled: (disabled && !recorderState.isRecording) || uploading }}
      disabled={(disabled && !recorderState.isRecording) || uploading}
      onPress={() => void (recorderState.isRecording ? stopAndUpload() : startRecording())}
      style={[styles.option, ((disabled && !recorderState.isRecording) || uploading) && styles.optionDisabled]}>
      <Text style={styles.optionLabel}>
        {uploading ? labels.uploading : recorderState.isRecording ? labels.stopAndSave : labels.record}
      </Text>
    </AnimatedPressable>
  </View>;
}
