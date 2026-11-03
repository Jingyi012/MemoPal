import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEducationStudyList, isValidEducationStudyList } from '../src/features/education/utils/educationStudyList.ts';

test('pasted words and spreadsheet meanings remain intact without inventing clues', () => {
  const entries = parseEducationStudyList('ice-cream\t冰淇淋\r\nbook\n\n');
  assert.deepEqual(entries, [{ text: 'ice-cream', meaning: '冰淇淋' }, { text: 'book', meaning: null }]);
  assert.equal(isValidEducationStudyList(entries), true);
});
test('invalid or oversized lists remain available for correction but cannot be submitted', () => {
  assert.equal(isValidEducationStudyList(parseEducationStudyList('Book\nbook')), false);
  assert.equal(isValidEducationStudyList(parseEducationStudyList('\tmeaning without a word')), false);
  assert.equal(isValidEducationStudyList(parseEducationStudyList('')), false);
  assert.equal(isValidEducationStudyList(parseEducationStudyList('字'.repeat(501))), false);
  assert.equal(isValidEducationStudyList(Array.from({ length: 51 }, (_, i) => ({ text: String(i), meaning: null }))), false);
});
