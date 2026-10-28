import type {
  EducationAnswer,
  EducationAttemptAnswerDto,
  EducationQuestion,
  VoiceResponseAnswer,
  EducationResponseAttachmentFile,
} from '@/features/education/types/question.types';
import { FillBlankInput } from './FillBlankInput';
import { SingleChoiceInput } from './SingleChoiceInput';
import { MultipleSelectInput } from './MultipleSelectInput';
import { TrueFalseInput } from './TrueFalseInput';
import { OrderingInput } from './OrderingInput';
import { MatchingInput } from './MatchingInput';
import { WrittenResponseInput } from './WrittenResponseInput';
import { PhotoResponseInput } from './PhotoResponseInput';
import { VoiceResponseInput } from './VoiceResponseInput';
import { CorrectAnswerContext, QuestionFeedbackContext, QuestionHintsContext } from './questionInputStyles';

export type QuestionInputLabels = Readonly<{
  trueLabel: string;
  falseLabel: string;
  fillBlankPlaceholder: string;
  multipleSelectHint: string;
  orderingHint: string;
  orderingYourOrder: string;
  orderingWordBank: (remaining: number) => string;
  orderingRemoveWord: string;
  orderingAddWord: string;
  moveUpLabel: string;
  moveDownLabel: string;
  matchingHint: string;
  chooseMatchLabel: string;
  writtenResponseHint: string;
  photoResponseHint: string;
  photoResponsePromptHint: string;
  choosePhoto: string;
  photoAttached: string;
  photoUploading: string;
  photoUploadError: string;
  openHandwritingCanvas: string;
  handwritingGrid: string;
  handwritingGridEnabled: string;
  handwritingUndo: string;
  handwritingClear: string;
  handwritingSave: string;
  handwritingSaving: string;
  handwritingDiscard: string;
  handwritingRetry: string;
  handwritingUploadError: string;
  handwritingSaved: string;
  photoReplaceTitle: string;
  photoReplaceBody: string;
  photoReplaceConfirm: string;
  handwritingDiscardBeforeReplace: string;
  handwritingLimit: string;
  cancel: string;
  voiceResponseHint: string;
  startVoiceRecording: string;
  stopAndSaveVoiceRecording: string;
  voiceRecordingAttached: string;
  playVoiceRecording: string;
  pauseVoiceRecording: string;
  loadingVoiceRecording: string;
  voicePreviewError: string;
  voiceRecordingPermissionDenied: string;
  voiceRecordingError: string;
  voiceRecordingUploading: string;
}>;

type QuestionInputProps = Readonly<{
  attemptId: string;
  identity?: string;
  question: EducationQuestion;
  value: EducationAnswer;
  onChange: (value: EducationAnswer) => void;
  labels: QuestionInputLabels;
  disabled?: boolean;
  expired?: boolean;
  orderingBuilder?: boolean;
  feedback?: boolean | null;
  correctAnswer?: EducationAttemptAnswerDto | null;
  showHints?: boolean;
  onUploadAttachment?: (file: EducationResponseAttachmentFile, kind: 'photo' | 'audio') => Promise<string>;
  onRecordingChange?: (recording: boolean) => void;
  onSketchWorkChange?: (hasUnsavedWork: boolean, processing: boolean) => void;
  onLocalAttachmentPreview?: (questionId: string, uri: string, cleanup: () => void) => void;
}>;

export function QuestionInput(props: QuestionInputProps) {
  return <QuestionFeedbackContext.Provider value={props.feedback ?? null}><CorrectAnswerContext.Provider value={props.correctAnswer ?? null}><QuestionHintsContext.Provider value={props.showHints ?? true}><QuestionInputFields {...props} /></QuestionHintsContext.Provider></CorrectAnswerContext.Provider></QuestionFeedbackContext.Provider>;
}

function QuestionInputFields(props: QuestionInputProps) {
  if (props.question.type === 'single-choice' && props.value.type === 'single-choice') {
    return (
      <SingleChoiceInput
        key={`${props.attemptId}:${props.question.id}`}
        question={props.question}
        value={props.value}
        onChange={props.onChange}
        disabled={props.disabled}
      />
    );
  }

  if (props.question.type === 'multiple-select' && props.value.type === 'multiple-select') {
    return <MultipleSelectInput key={`${props.attemptId}:${props.question.id}`} question={props.question} value={props.value} onChange={props.onChange} hint={props.labels.multipleSelectHint} disabled={props.disabled} />;
  }

  if (props.question.type === 'ordering' && props.value.type === 'ordering') {
    return <OrderingInput key={`${props.attemptId}:${props.question.id}`} question={props.question} value={props.value} onChange={props.onChange}
      labels={{ hint: props.labels.orderingHint, moveUp: props.labels.moveUpLabel, moveDown: props.labels.moveDownLabel,
        yourOrder: props.labels.orderingYourOrder, wordBank: props.labels.orderingWordBank,
        removeWord: props.labels.orderingRemoveWord, addWord: props.labels.orderingAddWord }}
      buildFromWordBank={props.orderingBuilder} disabled={props.disabled} />;
  }

  if (props.question.type === 'matching' && props.value.type === 'matching') {
    return <MatchingInput key={`${props.attemptId}:${props.question.id}`} question={props.question} value={props.value} onChange={props.onChange}
      labels={{ hint: props.labels.matchingHint, chooseMatch: props.labels.chooseMatchLabel }} disabled={props.disabled} />;
  }

  if (props.question.type === 'true-false' && props.value.type === 'true-false') {
    return (
      <TrueFalseInput
        key={`${props.attemptId}:${props.question.id}`}
        question={props.question}
        value={props.value}
        onChange={props.onChange}
        labels={{ trueLabel: props.labels.trueLabel, falseLabel: props.labels.falseLabel }}
        disabled={props.disabled}
      />
    );
  }

  if (props.question.type === 'fill-blank' && props.value.type === 'fill-blank') {
    return (
      <FillBlankInput
        key={`${props.attemptId}:${props.question.id}`}
        question={props.question}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.labels.fillBlankPlaceholder}
        disabled={props.disabled}
      />
    );
  }

  if (props.question.type === 'written-response' && props.value.type === 'written-response') {
    return <WrittenResponseInput key={`${props.attemptId}:${props.question.id}`} question={props.question} value={props.value} onChange={props.onChange}
      hint={props.labels.writtenResponseHint} placeholder={props.labels.fillBlankPlaceholder} disabled={props.disabled} />;
  }

  if (props.question.type === 'photo-response' && props.value.type === 'photo-response' && props.onUploadAttachment) {
    const identity = props.identity ?? props.attemptId;
    return <PhotoResponseInput key={`${identity}:${props.attemptId}:${props.question.id}`} identity={identity}
      question={props.question} value={props.value}
      onUpload={file => props.onUploadAttachment!(file, 'photo')}
      onChange={props.onChange}
      onLocalPreview={(uri, cleanup) => props.onLocalAttachmentPreview?.(props.question.id, uri, cleanup)}
      onWorkChange={props.onSketchWorkChange ?? (() => undefined)}
      labels={{ promptHint: props.labels.photoResponsePromptHint, hint: props.labels.photoResponseHint,
        choose: props.labels.choosePhoto, attached: props.labels.photoAttached, uploading: props.labels.photoUploading,
        uploadError: props.labels.photoUploadError, openCanvas: props.labels.openHandwritingCanvas,
        grid: props.labels.handwritingGrid, gridEnabled: props.labels.handwritingGridEnabled,
        undo: props.labels.handwritingUndo, clear: props.labels.handwritingClear, saveDrawing: props.labels.handwritingSave,
        savingDrawing: props.labels.handwritingSaving, discardDrawing: props.labels.handwritingDiscard,
        retryDrawing: props.labels.handwritingRetry, drawingUploadError: props.labels.handwritingUploadError,
        drawingSaved: props.labels.handwritingSaved, replaceTitle: props.labels.photoReplaceTitle,
        replaceBody: props.labels.photoReplaceBody, replaceConfirm: props.labels.photoReplaceConfirm,
        cancel: props.labels.cancel, discardBeforeReplace: props.labels.handwritingDiscardBeforeReplace,
        handwritingLimit: props.labels.handwritingLimit }}
      disabled={props.disabled} expired={props.expired} />;
  }

  if (props.question.type === 'voice-response' && props.value.type === 'voice-response' && props.onUploadAttachment) {
    return <VoiceResponseInput key={`${props.attemptId}:${props.question.id}`} attemptId={props.attemptId} question={props.question} value={props.value} onRecordingChange={props.onRecordingChange}
      onUpload={async file => {
        const audioAttachmentId = await props.onUploadAttachment!(file, 'audio');
        props.onChange({ type: 'voice-response', audioAttachmentId, localUri: file.uri } satisfies VoiceResponseAnswer);
      }}
      labels={{ hint: props.labels.voiceResponseHint, record: props.labels.startVoiceRecording,
        stopAndSave: props.labels.stopAndSaveVoiceRecording, attached: props.labels.voiceRecordingAttached,
        playRecording: props.labels.playVoiceRecording, pauseRecording: props.labels.pauseVoiceRecording,
        loadingRecording: props.labels.loadingVoiceRecording, previewError: props.labels.voicePreviewError,
        permissionDenied: props.labels.voiceRecordingPermissionDenied, recordingError: props.labels.voiceRecordingError,
        uploading: props.labels.voiceRecordingUploading }}
      disabled={props.disabled} />;
  }

  throw new Error(
    `Question type "${props.question.type}" does not match answer type "${props.value.type}" for question "${props.question.id}".`,
  );
}

export type { QuestionInputProps };
