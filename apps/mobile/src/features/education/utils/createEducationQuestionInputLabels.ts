import type { QuestionInputLabels } from '@/features/education/components/question-inputs';
import type { useEducationCopy } from '@/features/education/i18n';

type EducationCopy = ReturnType<typeof useEducationCopy>;

export function createEducationQuestionInputLabels(copy: EducationCopy): QuestionInputLabels {
  return {
    trueLabel: copy.trueLabel,
    falseLabel: copy.falseLabel,
    fillBlankPlaceholder: copy.answerPlaceholder,
    multipleSelectHint: copy.multipleSelectHint,
    orderingHint: copy.orderingHint,
    moveUpLabel: copy.moveUp,
    moveDownLabel: copy.moveDown,
    matchingHint: copy.matchingHint,
    chooseMatchLabel: copy.chooseMatch,
    writtenResponseHint: copy.writtenResponseHint,
    photoResponseHint: copy.photoResponseHint,
    choosePhoto: copy.choosePhoto,
    photoAttached: copy.photoAttached,
    photoUploading: copy.photoUploading,
    photoUploadError: copy.photoUploadError,
    voiceResponseHint: copy.voiceResponseHint,
    startVoiceRecording: copy.startVoiceRecording,
    stopAndSaveVoiceRecording: copy.stopAndSaveVoiceRecording,
    voiceRecordingAttached: copy.voiceRecordingAttached,
    playVoiceRecording: copy.playVoiceRecording,
    pauseVoiceRecording: copy.pauseVoiceRecording,
    loadingVoiceRecording: copy.loadingVoiceRecording,
    voicePreviewError: copy.voicePreviewError,
    voiceRecordingPermissionDenied: copy.voiceRecordingPermissionDenied,
    voiceRecordingError: copy.voiceRecordingError,
    voiceRecordingUploading: copy.voiceRecordingUploading,
  };
}
