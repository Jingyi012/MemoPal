export type PearlQuest = {
  phase: 'ready' | 'playing' | 'solved' | 'timeUp';
  seconds: number;
  cards: number[];
  open: number[];
  matched: number[];
  combo: number;
  bestCombo: number;
  hintsLeft: number;
  attempts: number;
};

export const INITIAL_PEARL_QUEST: PearlQuest = {
  phase: 'ready', seconds: 45, cards: [], open: [], matched: [], combo: 0, bestCombo: 0,
  hintsLeft: 1, attempts: 0,
};

export type PearlQuestEvent =
  | { type: 'start'; cards: number[] }
  | { type: 'flip'; index: number }
  | { type: 'hide' }
  | { type: 'hint' }
  | { type: 'tick' }
  | { type: 'reset' };

/** Cosmetic play only. Account XP and bond still come from the server. */
export function pearlQuestReducer(state: PearlQuest, event: PearlQuestEvent): PearlQuest {
  if (event.type === 'reset') return INITIAL_PEARL_QUEST;
  if (event.type === 'start') {
    if (event.cards.length !== 8 || [0, 1, 2, 3].some((n) => event.cards.filter((card) => card === n).length !== 2)) return state;
    return { ...INITIAL_PEARL_QUEST, phase: 'playing', cards: [...event.cards] };
  }
  if (event.type === 'tick') {
    if (state.phase !== 'playing') return state;
    return state.seconds <= 1
      ? { ...state, phase: 'timeUp', seconds: 0, open: [] }
      : { ...state, seconds: state.seconds - 1 };
  }
  if (state.phase !== 'playing') return state;
  if (event.type === 'hint') {
    if (!state.hintsLeft || state.open.length > 0) return state;
    const index = state.cards.findIndex((_, i) => !state.matched.includes(i));
    return index < 0 ? state : { ...state, open: [index], hintsLeft: 0 };
  }
  if (event.type === 'hide') return state.open.length === 2 ? { ...state, open: [] } : state;
  if (event.type !== 'flip') return state;
  const { index } = event;
  if (!Number.isInteger(index) || index < 0 || index >= state.cards.length || state.open.includes(index) || state.matched.includes(index) || state.open.length === 2) return state;
  if (state.open.length === 0) return { ...state, open: [index] };
  const first = state.open[0];
  const attempts = state.attempts + 1;
  if (state.cards[first] !== state.cards[index]) return { ...state, open: [first, index], combo: 0, attempts };
  const matched = [...state.matched, first, index];
  const combo = state.combo + 1;
  return { ...state, open: [], matched, combo, bestCombo: Math.max(state.bestCombo, combo), attempts, phase: matched.length === 8 ? 'solved' : 'playing' };
}

export function shuffledPearls(random = Math.random): number[] {
  const cards = [0, 0, 1, 1, 2, 2, 3, 3];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.max(0, Math.min(i, Math.floor(random() * (i + 1))));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
