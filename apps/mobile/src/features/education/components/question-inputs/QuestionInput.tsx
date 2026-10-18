import type {
  EducationAnswer,
  EducationQuestion,
  PhotoResponseAnswer,
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

export type QuestionInputLabels = Readonly<{
  trueLabel: string;
  falseLabel: string;
  fillBlankPlaceholder: string;
  multipleSelectHint: string;
  orderingHint: string;
  moveUpLabel: string;
  moveDownLabel: string;
  matchingHint: string;
  chooseMatchLabel: string;
  writtenResponseHint: string;
  photoResponseHint: string;
  choosePhoto: string;
  photoAttached: string;
  photoUploading: string;
  photoUploadError: string;
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
  question: EducationQuestion;
  value: EducationAnswer;
  onChange: (value: EducationAnswer) => void;
  labels: QuestionInputLabels;
  disabled?: boolean;
  onUploadAttachment?: (file: EducationResponseAttachmentFile, kind: 'photo' | 'audio') => Promise<string>;
  onRecordingChange?: (recording: boolean) => void;
}>;

export function QuestionInput(props: QuestionInputProps) {
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
      labels={{ hint: props.labels.orderingHint, moveUp: props.labels.moveUpLabel, moveDown: props.labels.moveDownLabel }} disabled={props.disabled} />;
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
    return <PhotoResponseInput key={`${props.attemptId}:${props.question.id}`} question={props.question} value={props.value}
      onUpload={async file => {
        const photoAttachmentId = await props.onUploadAttachment!(file, 'photo');
        props.onChange({ type: 'photo-response', photoAttachmentId, localUri: file.uri } satisfies PhotoResponseAnswer);
      }}
      labels={{ hint: props.labels.photoResponseHint, choose: props.labels.choosePhoto, attached: props.labels.photoAttached,
        uploading: props.labels.photoUploading, uploadError: props.labels.photoUploadError }}
      disabled={props.disabled} />;
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
