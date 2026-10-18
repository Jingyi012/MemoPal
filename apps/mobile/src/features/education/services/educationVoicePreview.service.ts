import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { educationAttemptApi } from '../api/educationAttempt.api';

export type CachedEducationVoicePreview = Readonly<{ uri: string; cleanup: () => void }>;

function extensionForAudioType(mimeType: string): string {
  switch (mimeType.toLowerCase()) {
    case 'audio/mp4': case 'audio/m4a': return 'm4a';
    case 'audio/webm': return 'webm';
    case 'audio/wav': case 'audio/x-wav': return 'wav';
    case 'audio/mpeg': return 'mp3';
    default: throw new Error('The saved response is not a supported audio format.');
  }
}

export async function loadEducationVoicePreview(
  attemptId: string,
  questionId: string,
  attachmentId: string,
): Promise<CachedEducationVoicePreview> {
  const { bytes, mimeType } = await educationAttemptApi.getResponseAudio(attemptId, questionId, attachmentId);
  const extension = extensionForAudioType(mimeType);

  if (Platform.OS === 'web') {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const uri = URL.createObjectURL(new Blob([buffer], { type: mimeType }));
    return { uri, cleanup: () => URL.revokeObjectURL(uri) };
  }

  const safeId = attachmentId.replace(/[^a-zA-Z0-9-]/g, '');
  const file = new File(Paths.cache, `education-response-${safeId}.${extension}`);
  if (file.exists) file.delete();
  file.write(bytes);
  return { uri: file.uri, cleanup: () => { if (file.exists) file.delete(); } };
}
