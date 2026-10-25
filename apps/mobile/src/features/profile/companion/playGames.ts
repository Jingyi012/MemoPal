export type BubbleTarget = { id: number; x: number; kind: 'bubble' | 'urchin'; size: number; slot?: number };
export type BubbleGame = {
  phase: 'ready' | 'countdown' | 'playing' | 'done';
  countdown: number; seconds: number; score: number; streak: number; bestStreak: number;
  targets: BubbleTarget[];
};
export const INITIAL_BUBBLE_GAME: BubbleGame = {
  phase: 'ready', countdown: 3, seconds: 45, score: 0, streak: 0, bestStreak: 0, targets: [],
};
export type BubbleEvent =
  | { type: 'start'; seconds?: 45 | 60 } | { type: 'countdown' } | { type: 'tick' }
  | { type: 'spawn'; target: BubbleTarget } | { type: 'expire'; id: number }
  | { type: 'pop'; id: number } | { type: 'finish' };

/** Visual play only: these points are never connected to XP, bond, or the API. */
export function bubbleGameReducer(state: BubbleGame, event: BubbleEvent): BubbleGame {
  if (event.type === 'start') return { ...INITIAL_BUBBLE_GAME,
    seconds: event.seconds === 60 ? 60 : 45, phase: 'countdown' };
  if (event.type === 'countdown') {
    if (state.phase !== 'countdown') return state;
    return state.countdown === 1
      ? { ...state, countdown: 0, phase: 'playing' }
      : { ...state, countdown: state.countdown - 1 };
  }
  if (event.type === 'finish') return state.phase === 'playing' ? { ...state, phase: 'done', targets: [] } : state;
  if (state.phase !== 'playing') return state;
  if (event.type === 'tick') return state.seconds <= 1
    ? { ...state, seconds: 0, phase: 'done', targets: [] }
    : { ...state, seconds: state.seconds - 1 };
  if (event.type === 'spawn') {
    if (state.targets.length >= 8 || state.targets.some(t => t.id === event.target.id)) return state;
    const occupied = new Set(state.targets.map(t => t.slot));
    const slot = Array.from({ length: 8 }, (_, index) => index).find(index => !occupied.has(index));
    return { ...state, targets: [...state.targets, { ...event.target, slot }] };
  }
  if (event.type === 'expire') return { ...state, targets: state.targets.filter(t => t.id !== event.id) };
  if (event.type === 'pop') {
    const target = state.targets.find(t => t.id === event.id);
    if (!target) return state;
    const targets = state.targets.filter(t => t.id !== event.id);
    if (target.kind === 'urchin') return { ...state, targets, streak: 0 };
    const streak = state.streak + 1;
    return { ...state, targets, streak, bestStreak: Math.max(state.bestStreak, streak),
      score: state.score + 1 + Math.floor(streak / 5) };
  }
  return state;
}

/** Inject the RNG to keep spawn positions and rare urchins reproducible in tests. */
export function createBubbleTarget(id: number, random = Math.random): BubbleTarget {
  const x = Math.max(.05, Math.min(.83, random() * .78 + .05));
  const kind = random() < .12 ? 'urchin' : 'bubble';
  const size = 48 + Math.floor(random() * 20);
  return { id, x, kind, size };
}

export type CoralGame = {
  phase: 'ready' | 'countdown' | 'showing' | 'answering' | 'done';
  countdown: number; seconds: number; round: number; pattern: number[];
  cursor: number; score: number; streak: number; bestStreak: number;
};
export const INITIAL_CORAL_GAME: CoralGame = {
  phase: 'ready', countdown: 3, seconds: 55, round: 1, pattern: [],
  cursor: 0, score: 0, streak: 0, bestStreak: 0,
};
export type CoralEvent =
  | { type: 'start' } | { type: 'countdown'; pattern?: number[] }
  | { type: 'shown' } | { type: 'pick'; index: number }
  | { type: 'next'; pattern: number[] } | { type: 'tick' } | { type: 'finish' };

const validPattern = (pattern: number[]) => pattern.length >= 2 && pattern.length <= 5
  && pattern.every(n => Number.isInteger(n) && n >= 0 && n < 4);

export function coralGameReducer(state: CoralGame, event: CoralEvent): CoralGame {
  if (event.type === 'start') return { ...INITIAL_CORAL_GAME, phase: 'countdown' };
  if (event.type === 'countdown') {
    if (state.phase !== 'countdown') return state;
    if (state.countdown > 1) return { ...state, countdown: state.countdown - 1 };
    return event.pattern && validPattern(event.pattern)
      ? { ...state, countdown: 0, phase: 'showing', pattern: [...event.pattern] } : state;
  }
  if (event.type === 'finish') return state.phase === 'ready' ? state : { ...state, phase: 'done' };
  if (event.type === 'tick') return state.phase === 'ready' || state.phase === 'done' ? state
    : state.seconds <= 1 ? { ...state, seconds: 0, phase: 'done' }
      : { ...state, seconds: state.seconds - 1 };
  if (event.type === 'shown') return state.phase === 'showing' ? { ...state, phase: 'answering', cursor: 0 } : state;
  if (event.type === 'next') return state.phase === 'answering' && state.cursor === state.pattern.length
    && state.round < 4 && validPattern(event.pattern)
    ? { ...state, phase: 'showing', round: state.round + 1, pattern: [...event.pattern], cursor: 0 } : state;
  if (event.type === 'pick' && state.phase === 'answering' && state.cursor < state.pattern.length) {
    if (event.index !== state.pattern[state.cursor]) return { ...state, phase: 'showing', cursor: 0, streak: 0 };
    const cursor = state.cursor + 1;
    const streak = state.streak + 1;
    const score = state.score + 1 + Math.floor(streak / 5);
    return { ...state, cursor, streak, score, bestStreak: Math.max(state.bestStreak, streak),
      phase: cursor === state.pattern.length && state.round === 4 ? 'done' : 'answering' };
  }
  return state;
}

export function createCoralPattern(length: number, random = Math.random): number[] {
  return Array.from({ length: Math.max(2, Math.min(5, Math.floor(length))) }, () =>
    Math.max(0, Math.min(3, Math.floor(random() * 4))));
}
