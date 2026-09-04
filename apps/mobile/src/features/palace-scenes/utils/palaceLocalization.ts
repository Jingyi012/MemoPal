import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';

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
