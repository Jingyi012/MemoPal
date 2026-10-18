export type PhotoResponseDto = Readonly<{ type: 'photo-response'; photoAttachmentId: string }>;

export function readPhotoResponse(dto: { type: string; photoAttachmentId?: unknown }) {
  if (dto.type !== 'photo-response' || typeof dto.photoAttachmentId !== 'string' || dto.photoAttachmentId.length === 0) return null;
  return { type: 'photo-response' as const, photoAttachmentId: dto.photoAttachmentId };
}

export function toPhotoResponseDto(photoAttachmentId: string | null): PhotoResponseDto | null {
  return photoAttachmentId ? { type: 'photo-response', photoAttachmentId } : null;
}

export function isPhotoResponseBlank(photoAttachmentId: string | null): boolean {
  return photoAttachmentId === null;
}
