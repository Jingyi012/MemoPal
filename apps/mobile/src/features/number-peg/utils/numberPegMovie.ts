import type { PegSceneRecipe } from '@/features/memory-sets';

export type SceneCategory = 'impact' | 'transform' | 'strange-use';
export type SceneAnchor = NonNullable<PegSceneRecipe['anchorSnapshot']>;
export type BoosterKey =
  | 'loud'
  | 'sticky'
  | 'hot'
  | 'icy'
  | 'giant'
  | 'tiny'
  | 'smelly'
  | 'funny'
  | 'surprising';

export type SceneCandidate = {
  category: SceneCategory;
  titleKey: 'crashIt' | 'transformIt' | 'useItStrangely';
  emoji: string;
  recipe: PegSceneRecipe;
  sceneText: string;
};

const candidateSets: readonly (readonly [
  PegSceneRecipe['actionPreset'],
  PegSceneRecipe['actionPreset'],
  PegSceneRecipe['actionPreset'],
])[] = [
  ['crash', 'melt', 'launch'],
  ['explode', 'stretch', 'swallow'],
  ['bounce', 'wrap', 'spin'],
];

const categories: readonly [SceneCategory, SceneCandidate['titleKey'], string][] = [
  ['impact', 'crashIt', '💥'],
  ['transform', 'transformIt', '🫠'],
  ['strange-use', 'useItStrangely', '🎪'],
];

export function buildSceneCandidates(
  anchor: SceneAnchor,
  answer: string,
  setIndex: number,
  translate: (key: string) => string
): SceneCandidate[] {
  const actions = candidateSets[normalizeSetIndex(setIndex)];
  return categories.map(([category, titleKey, emoji], index) => {
    const actionPreset = actions[index];
    const sceneText = buildSceneCaption(anchor.keyword, answer, actionPreset, translate);
    return {
      category,
      titleKey,
      emoji,
      sceneText,
      recipe: {
        schemaVersion: 2,
        associationSource: 'suggested',
        caption: sceneText,
        actionPreset,
        visualEffectPreset: actionPreset,
        soundPreset: 'complete',
        hapticPreset: 'impact',
        sensoryBoosters: [],
        targetVisual: { kind: 'word', value: answer },
        anchorSnapshot: anchor,
      },
    };
  });
}

export function buildInitialSceneCandidates(
  items: string[],
  anchors: SceneAnchor[],
  availablePegCount: number,
  translate: (key: string) => string
): SceneCandidate[] {
  const count = Math.max(1, Math.min(availablePegCount, anchors.length));
  return items.map((answer, index) =>
    buildSceneCandidates(anchors[index % count], answer, 0, translate)[0]
  );
}

export function buildSceneCaption(
  pegKeyword: string,
  answer: string,
  actionPreset: PegSceneRecipe['actionPreset'],
  translate: (key: string) => string,
  booster?: string
) {
  const templateKey = `scene_${actionPreset}`;
  const translatedTemplate = translate(templateKey);
  const fallback = `${pegKeyword} ${translate(`action_${actionPreset}`)} ${answer}.`;
  const caption = (translatedTemplate === templateKey ? fallback : translatedTemplate)
    .replaceAll('{peg}', pegKeyword)
    .replaceAll('{item}', answer);
  if (!booster) return caption;

  const boosterKey = `boosterCaption_${booster}`;
  const boosterCaption = translate(boosterKey);
  return `${caption} ${boosterCaption === boosterKey ? booster : boosterCaption}`;
}

export function getCandidateSetForAction(action: PegSceneRecipe['actionPreset']) {
  const index = candidateSets.findIndex((set) => set.includes(action));
  return index < 0 ? 0 : index;
}

export function getActionCategory(action: PegSceneRecipe['actionPreset']): SceneCategory {
  if (['crash', 'explode', 'bounce'].includes(action)) return 'impact';
  if (['melt', 'stretch', 'wrap'].includes(action)) return 'transform';
  return 'strange-use';
}

export function getMovieChoreography(action: PegSceneRecipe['actionPreset']) {
  const category = getActionCategory(action);
  if (category === 'impact') {
    return {
      category,
      pegFromX: -54, pegToX: -4, pegFromY: 0, pegToY: 0,
      pegFromScale: 0.9, pegToScale: 1.08,
      targetFromX: 34, targetToX: 6, targetFromY: 0, targetToY: 4,
      targetFromScale: 1, targetToScale: action === 'explode' ? 1.24 : 0.78,
      effectEmoji: action === 'explode' ? '💥' : action === 'bounce' ? '✨' : '💫',
    } as const;
  }
  if (category === 'transform') {
    return {
      category,
      pegFromX: -14, pegToX: 0, pegFromY: 0, pegToY: 0,
      pegFromScale: 1, pegToScale: action === 'wrap' ? 1.18 : 1,
      targetFromX: 18, targetToX: 0, targetFromY: 0,
      targetToY: action === 'melt' ? 18 : 0,
      targetFromScale: 1,
      targetToScale: action === 'stretch' ? 1.35 : action === 'melt' ? 0.72 : 0.9,
      effectEmoji: action === 'melt' ? '🫠' : action === 'wrap' ? '🌀' : '〰️',
    } as const;
  }
  return {
    category,
    pegFromX: -18, pegToX: 4, pegFromY: 0, pegToY: 0,
    pegFromScale: 1, pegToScale: action === 'swallow' ? 1.2 : 1,
    targetFromX: 18, targetToX: action === 'swallow' ? -24 : 12,
    targetFromY: action === 'launch' ? 34 : 18,
    targetToY: action === 'launch' ? -34 : -6,
    targetFromScale: 1, targetToScale: action === 'swallow' ? 0.22 : 1.06,
    effectEmoji: action === 'launch' ? '🚀' : action === 'spin' ? '🌪️' : '😮',
  } as const;
}

export function getBoosterPresentation(booster?: string | null) {
  switch (booster) {
    case 'loud': return { emoji: '🔊', tint: '#FFF0D0', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    case 'sticky': return { emoji: '🍯', tint: '#FFF4C7', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    case 'hot': return { emoji: '🔥', tint: '#FFE3D6', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    case 'icy': return { emoji: '❄️', tint: '#E5F5FF', soundPreset: 'correct' as const, hapticPreset: 'impact' as const };
    case 'giant': return { emoji: '🐘', tint: '#EEE9FF', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    case 'tiny': return { emoji: '🔎', tint: '#F4F1FF', soundPreset: 'correct' as const, hapticPreset: 'success' as const };
    case 'smelly': return { emoji: '🧦', tint: '#EAF4D7', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    case 'funny': return { emoji: '😂', tint: '#FFF0F4', soundPreset: 'correct' as const, hapticPreset: 'success' as const };
    case 'surprising': return { emoji: '😲', tint: '#FFF3D9', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
    default: return { emoji: '✨', tint: '#FFFCF4', soundPreset: 'complete' as const, hapticPreset: 'impact' as const };
  }
}

function normalizeSetIndex(index: number) {
  return ((index % candidateSets.length) + candidateSets.length) % candidateSets.length;
}
