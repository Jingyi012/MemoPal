export type OcrDraft = {
  items: string[];
  title?: string;
  goalType?: string;
};

const drafts = new Map<string, OcrDraft>();

/**
 * Keeps scan results out of route parameters. OCR text can be long, and a
 * short-lived in-memory hand-off also means photos and raw text are not added
 * to the persisted query cache or local database.
 */
export function saveOcrDraft(items: string[], context: Omit<OcrDraft, 'items'> = {}): string {
  const id = `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  drafts.set(id, { items, ...context });
  return id;
}

export function consumeOcrDraft(id: string | undefined): OcrDraft | null {
  if (!id) return null;
  const draft = drafts.get(id) ?? null;
  drafts.delete(id);
  return draft;
}
