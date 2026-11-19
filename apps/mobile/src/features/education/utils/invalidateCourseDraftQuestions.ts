import type { EducationCourseAiInput, StudyCourseAiMatchingPair, StudyCourseAiOutput } from '../api/educationCourseDraft.api';

function normalize(value: string | null | undefined): string {
  return (value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function isRepeatedCourseMeaning(word: string, meaning: string | null | undefined): boolean {
  const normalizedWord = normalize(word);
  return !!normalizedWord && normalizedWord === normalize(meaning);
}

export function matchingCoursePairCells(pair: StudyCourseAiMatchingPair): [string, string] {
  return [pair.left, pair.right];
}

/** Drops generated preview questions that cite any entry whose content has changed. */
export function invalidateCourseDraftQuestions(
  output: StudyCourseAiOutput | null,
  input: EducationCourseAiInput | null,
  includedIndexes: number[],
  changedEntryIds: string[],
): number[] {
  if (!output || !input || changedEntryIds.length === 0) return includedIndexes;
  const changed = new Set(changedEntryIds);
  const original = new Map(input.units.flatMap(unit => unit.entries.map(entry => [entry.id, entry] as const)));
  const suggestions = new Map(output.suggestions.map(item => [item.entryId, item]));
  return includedIndexes.filter(index => {
    const question = output.questions[index];
    if (!question || changed.has(question.entryId)) return false;
    if (question.type === 'matching' && question.pairs?.some(pair => changed.has(pair.entryId))) return false;
    if (question.type === 'single-choice') {
      const distractors = question.options.filter((_, optionIndex) => optionIndex !== question.correctOptionIndex).map(normalize);
      for (const id of changed) {
        const entry = original.get(id);
        const suggested = suggestions.get(id);
        const meanings = [entry?.meaning, suggested?.meaning].map(normalize).filter(Boolean);
        if (meanings.some(meaning => distractors.includes(meaning))) return false;
      }
    }
    return true;
  });
}
