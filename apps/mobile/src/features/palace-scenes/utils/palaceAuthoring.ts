import type { PalaceLocus } from '@/features/palace-scenes/types/palaceScene.types';

export function createPalaceAssociation(answer: string, locusName: string) {
  const cleanAnswer = answer.trim() || 'Your memory';
  return `${cleanAnswer} comes alive at the ${locusName}.`;
}

export function getAssociationText(
  associations: string[],
  index: number,
  answer: string,
  locus: PalaceLocus | undefined,
) {
  return associations[index]?.trim() || createPalaceAssociation(answer, locus?.name ?? `locus ${index + 1}`);
}

export function ensurePalaceAssociations(
  items: string[],
  loci: PalaceLocus[],
  associations: string[],
) {
  return items.map((item, index) => {
    const locus = loci.length ? loci[index % loci.length] : undefined;
    return associations[index] ?? createPalaceAssociation(item, locus?.name ?? `locus ${(index % Math.max(1, loci.length)) + 1}`);
  });
}
