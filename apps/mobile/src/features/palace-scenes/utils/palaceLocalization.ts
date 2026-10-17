import type { PalaceLocus, PalaceScene } from '@/features/palace-scenes/types/palaceScene.types';

type PalaceLanguage = 'en' | 'zh' | string;

/**
 * Returns authored copy for the active app language. User-created loci only
 * have the legacy `name`/`description` fields, so those remain the fallback.
 */
export function getPalaceLocusName(locus: PalaceLocus, language: PalaceLanguage): string {
  const localized = language === 'zh' ? locus.nameZh : locus.nameEn;
  return localized?.trim() || locus.name;
}

export function getPalaceLocusDescription(
  locus: PalaceLocus,
  language: PalaceLanguage,
  fallback: string,
): string {
  const localized = language === 'zh' ? locus.descriptionZh : locus.descriptionEn;
  return localized?.trim() || locus.description?.trim() || fallback;
}

const SEEDED_SCENE_NAMES: Record<string, { en: string; zh: string }> = {
  'palace-street-and-curb': { en: 'Home Office', zh: '家庭办公室' },
  'palace-foyer-entryway': { en: 'Foyer / Entryway', zh: '玄关' },
  'palace-living-room-core': { en: 'Living Room Core', zh: '客厅' },
  'palace-dining-area': { en: 'Dining Area', zh: '餐厅' },
  'palace-kitchen-work-triangle': { en: 'Kitchen Work Triangle', zh: '厨房' },
  'palace-pantry-and-storage': { en: 'Pantry & Storage', zh: '储藏室' },
  'palace-laundry-utility-room': { en: 'Laundry / Utility Room', zh: '洗衣房' },
  'palace-patio-outdoor-transition': { en: 'Bedroom', zh: '卧室' },
  'palace-garden-and-backyard-center': { en: 'Creative Workshop', zh: '创意工作室' },
};

/** Localize the built-in catalogue labels while preserving admin/user-authored names. */
export function getPalaceSceneName(scene: PalaceScene, language: PalaceLanguage): string {
  const seededName = SEEDED_SCENE_NAMES[scene.id];
  if (!seededName || scene.name.trim().toLocaleLowerCase() !== seededName.en.toLocaleLowerCase()) return scene.name;
  return language === 'zh' ? seededName.zh : seededName.en;
}
