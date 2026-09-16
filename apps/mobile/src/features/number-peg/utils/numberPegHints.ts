/** Hide literal answers (including repeated words) in an authored recall cue. */
export function maskNumberPegAnswer(text: string, answer: string) {
  const normalizedAnswer = answer.normalize('NFKC').trim();
  if (!normalizedAnswer) return '';
  const fragments = [...new Set([normalizedAnswer, ...normalizedAnswer.split(/\s+/u)])]
    .sort((left, right) => right.length - left.length)
    .map((fragment) => fragment.split(/\s+/u)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'));
  return text.normalize('NFKC').trim().replace(new RegExp(fragments.join('|'), 'giu'), '___');
}

export function getNumberPegStoryHint(story: string, answer: string) {
  const masked = maskNumberPegAnswer(story, answer);
  // A story containing only the answer provides no extra retrieval cue.
  return /[\p{L}\p{N}\p{Extended_Pictographic}]/u.test(masked.replaceAll('___', '')) ? masked : null;
}
