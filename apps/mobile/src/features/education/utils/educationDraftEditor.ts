import { parseEducationStudyList, isValidEducationStudyList } from './educationStudyList';

export type DraftWord = { id: string; text: string; meaning: string | null };
export type DraftUnit = { id: string; title: string; words: DraftWord[] };
export type DraftImportMode = 'manual' | 'paste' | 'scan';
export type StudyEditorSnapshot = { units: DraftUnit[]; targetUnitId: string; inputs: Record<string, string>; mode: DraftImportMode };
let sequence = 0;
export const draftId = () => `draft-${Date.now()}-${++sequence}`;
export const newDraftUnit = (title = ''): DraftUnit => ({ id: draftId(), title, words: [] });

export function addDraftWords(units: DraftUnit[], targetId: string, text: string): DraftUnit[] | null {
  const additions = parseEducationStudyList(text);
  if (!additions.length || !units.some(unit => unit.id === targetId)) return null;
  const all = [...units.flatMap(unit => unit.words), ...additions];
  if (!isValidEducationStudyList(all)) return null;
  return units.map(unit => unit.id === targetId ? { ...unit, words: [...unit.words, ...additions.map(word => ({ ...word, id: draftId() }))] } : unit);
}

export function changeDraftWord(units: DraftUnit[], wordId: string, targetId: string, text: string, meaning: string): DraftUnit[] | null {
  const word = units.flatMap(unit => unit.words).find(item => item.id === wordId);
  if (!word || !units.some(unit => unit.id === targetId)) return null;
  const edited = { ...word, text: text.normalize('NFC').trim(), meaning: meaning.normalize('NFC').trim() || null };
  const next = units.map(unit => ({ ...unit, words: unit.words.flatMap(item => item.id === wordId ? (unit.id === targetId ? [edited] : []) : [item]) }));
  if (!next.some(unit => unit.words.some(item => item.id === wordId))) {
    const target = next.find(unit => unit.id === targetId)!;
    target.words.push(edited);
  }
  return isValidEducationStudyList(next.flatMap(unit => unit.words)) ? next : null;
}

export function draftUnitsReady(units: DraftUnit[]): boolean {
  return units.length > 0 && units.length <= 50 && units.every(unit => unit.words.length > 0 && unit.title.trim().length <= 200)
    && isValidEducationStudyList(units.flatMap(unit => unit.words));
}

export function draftUnitsPayload(units: DraftUnit[], zh: boolean) {
  return units.map((unit, index) => ({ title: unit.title.trim() || (zh ? `单元 ${index + 1}` : `Unit ${index + 1}`),
    entries: unit.words.map(({ text, meaning }) => ({ text, meaning })) }));
}
