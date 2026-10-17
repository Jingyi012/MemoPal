import assert from 'node:assert/strict';
import test from 'node:test';

const { extractMemoryItems, MAX_OCR_ITEMS, parseOcrReviewText } = await import('../src/features/memory-composer/utils/ocrParsing.ts');
const { saveOcrDraft, consumeOcrDraft } = await import('../src/features/memory-composer/utils/ocrDraftStore.ts');
const { reorderItems } = await import('../src/features/memory-composer/utils/reorderItems.ts');

const box = (x, y, width = 100, height = 20) => ({ x, y, width, height });
const line = (text, x, y) => ({ text, boundingBox: box(x, y), elements: [] });

test('cleans, orders, and deduplicates photographed list lines', () => {
  const result = {
    text: '',
    blocks: [{
      text: '',
      boundingBox: box(0, 0, 300, 100),
      lines: [line('2. Banana', 0, 45), line('1) Apple', 0, 10), line('apple', 0, 80)],
    }],
  };

  assert.deepEqual(extractMemoryItems(result), [
    { value: 'Apple', needsReview: false },
    { value: 'Banana', needsReview: false },
  ]);
});

test('falls back to full OCR text and flags uncertain characters', () => {
  const result = { text: 'milk\n� bread\n\n• eggs', blocks: [] };

  assert.deepEqual(extractMemoryItems(result), [
    { value: 'milk', needsReview: false },
    { value: '� bread', needsReview: true },
    { value: 'eggs', needsReview: false },
  ]);
});

test('caps imported lists at the composer limit', () => {
  const lines = Array.from({ length: MAX_OCR_ITEMS + 4 }, (_, index) => line(`word ${index + 1}`, 0, index * 25));
  const result = { text: '', blocks: [{ text: '', boundingBox: box(0, 0), lines }] };

  assert.equal(extractMemoryItems(result).length, MAX_OCR_ITEMS);
  assert.equal(extractMemoryItems(result).at(-1)?.value, `word ${MAX_OCR_ITEMS}`);
});

test('quick review keeps one non-empty memory item per edited line and respects the item cap', () => {
  assert.deepEqual(parseOcrReviewText('  milk  \n\n eggs\r\nbread '), ['milk', 'eggs', 'bread']);
  assert.equal(parseOcrReviewText(Array.from({ length: MAX_OCR_ITEMS + 2 }, (_, index) => `item ${index}`).join('\n')).length, MAX_OCR_ITEMS);
});

test('hands scan results back once without putting text in route parameters', () => {
  const id = saveOcrDraft(['existing', 'scanned'], { title: 'Spelling', goalType: 'spelling' });

  assert.deepEqual(consumeOcrDraft(id), {
    items: ['existing', 'scanned'],
    title: 'Spelling',
    goalType: 'spelling',
  });
  assert.equal(consumeOcrDraft(id), null);
});

test('reorders scanned words without mutating the original list', () => {
  const original = ['first', 'second', 'third', 'fourth'];

  assert.deepEqual(reorderItems(original, 1, 3), ['first', 'third', 'fourth', 'second']);
  assert.deepEqual(original, ['first', 'second', 'third', 'fourth']);
});
