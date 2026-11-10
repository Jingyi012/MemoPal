/** Public diagram references are data; arbitrary media URLs are never interpreted here. */
export type PatternSymbol = 'red' | 'blue' | 'circle' | 'triangle' | 'square';
export type StudyIllustration = { kind: 'fraction'; parts: number; shaded: number } | { kind: 'shape'; shape: 'circle' | 'triangle' | 'square' | 'polygon'; sides: number } | { kind: 'pattern'; symbols: PatternSymbol[] };
const legacyFractions: Record<string, [number, number]> = { 'fraction-half': [1, 2], 'fraction-quarter': [1, 4], 'fraction-three-quarters': [3, 4] };
const symbols = new Set(['red', 'blue', 'circle', 'triangle', 'square']);
export function parseStudyIllustration(reference?: string | null): StudyIllustration | null {
  if (!reference) return null;
  const code = reference.startsWith('media:learning-') ? reference.slice(15) : reference;
  const legacy = legacyFractions[code];
  if (legacy) return { kind: 'fraction', shaded: legacy[0], parts: legacy[1] };
  const fraction = /^fraction-([0-9]+)-([0-9]+)$/.exec(code);
  if (fraction) { const shaded = Number(fraction[1]), parts = Number(fraction[2]); return parts >= 2 && parts <= 12 && shaded >= 0 && shaded <= parts ? {kind:'fraction', shaded, parts} : null; }
  if (code === 'shape-circle') return {kind:'shape', shape:'circle', sides:0};
  if (code === 'shape-triangle' || code === 'shape-square') return {kind:'shape', shape:code === 'shape-triangle' ? 'triangle' : 'square', sides:code === 'shape-triangle' ? 3 : 4};
  const polygon = /^shape-polygon-([0-9]+)$/.exec(code);
  if (polygon) { const sides = Number(polygon[1]); return sides >= 3 && sides <= 8 ? {kind:'shape', shape:'polygon', sides} : null; }
  if (code.startsWith('pattern-')) { const values = code.slice(8).split('-'); return values.length >= 2 && values.length <= 8 && values.every(value => symbols.has(value)) ? {kind:'pattern', symbols:values as PatternSymbol[]} : null; }
  return null;
}
