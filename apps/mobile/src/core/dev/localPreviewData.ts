import type {
  MemorySet,
  MemorySetUpsertRequest,
} from '@/features/memory-sets/types/memorySet.types';
import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';

export const isLocalPreviewEnabled =
  String(process.env.EXPO_PUBLIC_LOCAL_DEV_MODE).trim().toLowerCase() === 'true';

const PREVIEW_NOW = '2026-08-24T12:00:00.000Z';
const PREVIEW_USER_ID = 'local-preview-user';

function buildLoci(names: string[]): PalaceLocus[] {
  return names.map((name, index) => ({
    id: `preview-locus-${index + 1}`,
    position: index + 1,
    name,
    description: `A clear visual stop at the ${name.toLowerCase()}.`,
    xPercent: [11, 8, 27, 34, 31, 41, 53, 63, 74, 80, 84, 94][index] ?? 50,
    yPercent: [24, 50, 57, 33, 71, 84, 30, 60, 54, 25, 49, 66][index] ?? 50,
    radiusPercent: 7,
    createdAt: PREVIEW_NOW,
    createdBy: PREVIEW_USER_ID,
    updatedAt: PREVIEW_NOW,
    updatedBy: PREVIEW_USER_ID,
  }));
}

export const LOCAL_PREVIEW_SCENES: PalaceScene[] = [
  {
    id: 'preview-scene-memory-room',
    name: 'The Memory Room',
    description: 'A warm study room with twelve clear furniture and décor landmarks.',
    imageUrl: '/assets/palace-scenes/11-study-room.png',
    imageSource: require('../../../assets/palaces/11-study-room.png'),
    status: 'published',
    isTemplate: true,
    isPremium: false,
    version: 1,
    loci: buildLoci([
      'Framed landscape',
      'Desk lamp',
      'Desk surface',
      'Bookcase',
      'Desk chair',
      'Rug corner',
      'Window',
      'Reading chair',
      'Side table',
      'Wall clock',
      'Tall plant',
      'Side cabinet',
    ]),
    createdAt: PREVIEW_NOW,
    createdBy: PREVIEW_USER_ID,
    updatedAt: PREVIEW_NOW,
    updatedBy: PREVIEW_USER_ID,
  },
];

function buildItems(values: string[], promptPrefix: string) {
  return values.map((answer, index) => ({
    id: `preview-item-${promptPrefix}-${index + 1}`,
    position: index + 1,
    prompt: `${promptPrefix} ${index + 1}`,
    answer,
  }));
}

const previewScene = LOCAL_PREVIEW_SCENES[0];
const previewPegItems = ['planet', 'cereal', 'notebook', 'raincoat', 'strawberries'];
const previewPalaceItems = ['milk', 'bananas', 'pasta', 'toothpaste', 'apples', 'soap'];

export let localPreviewMemorySets: MemorySet[] = [
  {
    id: 'preview-number-peg-spelling',
    title: 'Friday spelling sprint',
    description: 'A tiny practice set for a quick spelling warm-up.',
    goalType: 'spelling',
    techniqueKey: 'number-peg',
    status: 'ready',
    visibility: 'private',
    version: 1,
    items: buildItems(previewPegItems, 'Spell item'),
    techniquePlan: {
      id: 'preview-plan-peg',
      techniqueKey: 'number-peg',
      schemaVersion: 1,
      pegBindings: previewPegItems.map((answer, index) => ({
        id: `preview-peg-binding-${index + 1}`,
        memoryItemId: `preview-item-Spell item-${index + 1}`,
        pegNumber: index + 1,
        sceneText: `Make the number peg bounce, spin, and shout the word “${answer}”.`,
        isCustomScene: true,
      })),
      palaceBindings: [],
    },
    createdAt: PREVIEW_NOW,
    updatedAt: PREVIEW_NOW,
  },
  {
    id: 'preview-palace-grocery',
    title: 'Saturday grocery run',
    description: 'A walk through the room for a useful shopping list.',
    goalType: 'ordered-list',
    techniqueKey: 'palace',
    status: 'ready',
    visibility: 'private',
    version: 1,
    items: buildItems(previewPalaceItems, 'Recall locus'),
    techniquePlan: {
      id: 'preview-plan-palace',
      techniqueKey: 'palace',
      schemaVersion: 1,
      palaceSceneId: previewScene.id,
      pegBindings: [],
      palaceBindings: previewPalaceItems.map((answer, index) => ({
        id: `preview-palace-binding-${index + 1}`,
        memoryItemId: `preview-item-Recall locus-${index + 1}`,
        locusId: previewScene.loci[index].id,
        associationText: `${answer} bursts into a ridiculous scene at the ${previewScene.loci[index].name.toLowerCase()}.`,
        isCustomScene: true,
      })),
    },
    createdAt: PREVIEW_NOW,
    updatedAt: PREVIEW_NOW,
  },
];

export function getLocalPreviewMemorySets(): MemorySet[] {
  return localPreviewMemorySets.map((memorySet) => ({
    ...memorySet,
    items: memorySet.items.map((item) => ({ ...item })),
    techniquePlan: memorySet.techniquePlan
      ? {
          ...memorySet.techniquePlan,
          pegBindings: memorySet.techniquePlan.pegBindings.map((binding) => ({ ...binding })),
          palaceBindings: memorySet.techniquePlan.palaceBindings.map((binding) => ({ ...binding })),
        }
      : null,
  }));
}

export function getLocalPreviewMemorySet(memorySetId: string): MemorySet | undefined {
  return getLocalPreviewMemorySets().find((memorySet) => memorySet.id === memorySetId);
}

export function createLocalPreviewMemorySet(request: MemorySetUpsertRequest): MemorySet {
  const timestamp = new Date().toISOString();
  const id = `preview-memory-${Date.now()}`;
  const items = request.items.map((item, index) => ({
    id: `${id}-item-${index + 1}`,
    position: item.position,
    prompt: item.prompt,
    answer: item.answer,
    hint: item.hint ?? null,
    pronunciationAudioUrl: item.pronunciationAudioUrl ?? null,
  }));
  const techniquePlan = request.techniquePlan
    ? {
        id: `${id}-plan`,
        techniqueKey: request.techniqueKey,
        schemaVersion: request.techniquePlan.schemaVersion,
        palaceSceneId: request.techniquePlan.palaceSceneId ?? null,
        pegBindings: request.techniquePlan.pegBindings.map((binding, index) => ({
          id: `${id}-peg-${index + 1}`,
          memoryItemId: items[binding.itemPosition - 1]?.id ?? '',
          pegNumber: binding.pegNumber,
          sceneText: binding.sceneText,
          sceneRecipe: binding.sceneRecipe ?? null,
          isCustomScene: binding.isCustomScene,
          sceneAssetUrl: binding.sceneAssetUrl ?? null,
        })),
        palaceBindings: request.techniquePlan.palaceBindings.map((binding, index) => ({
          id: `${id}-locus-${index + 1}`,
          memoryItemId: items[binding.itemPosition - 1]?.id ?? '',
          locusId: binding.locusId,
          associationText: binding.associationText,
          isCustomScene: binding.isCustomScene,
          sceneAssetUrl: binding.sceneAssetUrl ?? null,
        })),
      }
    : null;
  const created: MemorySet = {
    id,
    title: request.title,
    description: request.description ?? null,
    goalType: request.goalType,
    techniqueKey: request.techniqueKey,
    status: request.status,
    visibility: request.visibility,
    version: 1,
    items,
    techniquePlan,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  localPreviewMemorySets = [created, ...localPreviewMemorySets];
  return created;
}

export function updateLocalPreviewMemorySet(memorySetId: string, request: MemorySetUpsertRequest) {
  const current = getLocalPreviewMemorySet(memorySetId);
  if (!current) throw new Error('Preview memory not found.');
  const created = createLocalPreviewMemorySet({ ...request, title: request.title.trim() });
  const updated = { ...created, id: current.id, version: current.version + 1 };
  localPreviewMemorySets = [
    updated,
    ...localPreviewMemorySets.filter(
      (memorySet) => memorySet.id !== current.id && memorySet.id !== created.id
    ),
  ];
  return updated;
}

export function archiveLocalPreviewMemorySet(memorySetId: string, isArchived: boolean) {
  const current = getLocalPreviewMemorySet(memorySetId);
  if (!current) throw new Error('Preview memory not found.');
  const updated = {
    ...current,
    status: isArchived ? 'archived' : 'ready',
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  } as MemorySet;
  localPreviewMemorySets = localPreviewMemorySets.map((memorySet) =>
    memorySet.id === memorySetId ? updated : memorySet
  );
  return updated;
}

export function setLocalPreviewMemorySetVisibility(memorySetId: string, visibility: 'private' | 'public') {
  const current = getLocalPreviewMemorySet(memorySetId);
  if (!current) throw new Error('Preview memory not found.');
  const updated = { ...current, visibility, version: current.version + 1, updatedAt: new Date().toISOString() };
  localPreviewMemorySets = localPreviewMemorySets.map((memorySet) => memorySet.id === memorySetId ? updated : memorySet);
  return updated;
}

export function duplicateLocalPreviewMemorySet(memorySetId: string) {
  const current = getLocalPreviewMemorySet(memorySetId);
  if (!current) throw new Error('Preview memory not found.');
  return createLocalPreviewMemorySet({
    title: `${current.title} copy`,
    description: current.description,
    goalType: current.goalType,
    techniqueKey: current.techniqueKey,
    status: 'ready',
    visibility: current.visibility,
    items: current.items.map(({ position, prompt, answer, hint, pronunciationAudioUrl }) => ({
      position,
      prompt,
      answer,
      hint,
      pronunciationAudioUrl,
    })),
    techniquePlan: current.techniquePlan
      ? {
          schemaVersion: current.techniquePlan.schemaVersion,
          palaceSceneId: current.techniquePlan.palaceSceneId,
          pegBindings: current.techniquePlan.pegBindings.map(
            ({ memoryItemId: _memoryItemId, id: _id, ...binding }, index) => ({
              ...binding,
              itemPosition: index + 1,
            })
          ),
          palaceBindings: current.techniquePlan.palaceBindings.map(
            ({ memoryItemId: _memoryItemId, id: _id, ...binding }, index) => ({
              ...binding,
              itemPosition: index + 1,
            })
          ),
        }
      : null,
  });
}

export function deleteLocalPreviewMemorySet(memorySetId: string) {
  localPreviewMemorySets = localPreviewMemorySets.filter(
    (memorySet) => memorySet.id !== memorySetId
  );
}
