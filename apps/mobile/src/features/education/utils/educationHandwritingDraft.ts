export type HandwritingPoint = Readonly<{ x: number; y: number }>;
export type HandwritingStroke = readonly HandwritingPoint[];
export type HandwritingDraft = Readonly<{
  identity: string;
  strokes: readonly HandwritingStroke[];
  pendingFile: boolean;
  expired: boolean;
}>;

export const HANDWRITING_MAX_STROKES = 80;
export const HANDWRITING_MAX_POINTS_PER_STROKE = 500;
export const HANDWRITING_MAX_TOTAL_POINTS = 8000;

export function createHandwritingDraft(identity: string): HandwritingDraft {
  return { identity, strokes: [], pendingFile: false, expired: false };
}

export function appendHandwritingPoint(
  strokes: readonly HandwritingStroke[],
  point: HandwritingPoint,
  startStroke = false,
): readonly HandwritingStroke[] {
  const totalPoints = strokes.reduce((total, stroke) => total + stroke.length, 0);
  if (totalPoints >= HANDWRITING_MAX_TOTAL_POINTS) return strokes;

  if (startStroke) {
    if (strokes.length >= HANDWRITING_MAX_STROKES) return strokes;
    return [...strokes, [point]];
  }

  const lastStroke = strokes.at(-1);
  if (!lastStroke || lastStroke.length >= HANDWRITING_MAX_POINTS_PER_STROKE) return strokes;
  return [...strokes.slice(0, -1), [...lastStroke, point]];
}

export function handwritingHasUnsavedWork(draft: HandwritingDraft, capturing: boolean, uploading: boolean): boolean {
  return !draft.expired && (draft.strokes.length > 0 || draft.pendingFile || capturing || uploading);
}

export function canEditHandwritingDraft(draft: HandwritingDraft, capturing: boolean, uploading: boolean): boolean {
  return !draft.expired && !draft.pendingFile && !capturing && !uploading;
}

export function markHandwritingFilePending(draft: HandwritingDraft): HandwritingDraft {
  return { ...draft, pendingFile: true };
}

export function completeHandwritingDraft(draft: HandwritingDraft): HandwritingDraft {
  return { ...draft, strokes: [], pendingFile: false };
}

export function resetHandwritingDraftForIdentity(draft: HandwritingDraft, identity: string): HandwritingDraft {
  return draft.identity === identity ? draft : createHandwritingDraft(identity);
}

export function discardHandwritingDraft(draft: HandwritingDraft): HandwritingDraft {
  return { ...draft, strokes: [], pendingFile: false };
}

export function expireHandwritingDraft(draft: HandwritingDraft): HandwritingDraft {
  return { ...draft, strokes: [], pendingFile: false, expired: true };
}
