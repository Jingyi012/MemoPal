export type VoiceResponseDto = Readonly<{ type: 'voice-response'; audioAttachmentId: string }>;

export function readVoiceResponse(dto: { type: string; audioAttachmentId?: unknown }) {
  if (dto.type !== 'voice-response' || typeof dto.audioAttachmentId !== 'string' || dto.audioAttachmentId.length === 0) return null;
  return { type: 'voice-response' as const, audioAttachmentId: dto.audioAttachmentId };
}

export function toVoiceResponseDto(audioAttachmentId: string | null): VoiceResponseDto | null {
  return audioAttachmentId ? { type: 'voice-response', audioAttachmentId } : null;
}

export function isVoiceResponseBlank(audioAttachmentId: string | null): boolean {
  return audioAttachmentId === null;
}
