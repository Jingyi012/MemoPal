import test from 'node:test';
import assert from 'node:assert/strict';
import { studyLibraryItems, filterStudyLibrary } from '../src/features/education/utils/educationStudyLibrary.ts';

const own = [
  { id: 'own', title: 'School words', readyToLearn: true },
  { id: 'draft', title: '听写', readyToLearn: false },
];
const saved = [{ id: 'own', title: 'Saved school course' }];

test('library retains source identity even when ids match', () => {
  const items = studyLibraryItems(own, saved);
  assert.deepEqual(items.map(x => `${x.source}-${x.course.id}`), ['personal-own', 'personal-draft', 'saved-own']);
  assert.equal(items[0].course, own[0]);
  assert.equal(items[2].course, saved[0]);
});

test('created includes ready content and drafts, saved never appears in drafts', () => {
  const items = studyLibraryItems(own, saved);
  assert.equal(filterStudyLibrary(items, 'all', '').length, 3);
  assert.equal(filterStudyLibrary(items, 'personal', '').length, 2);
  assert.deepEqual(filterStudyLibrary(items, 'draft', '').map(x => x.course.id), ['draft']);
  assert.equal(filterStudyLibrary(items, 'saved', '').length, 1);
});

test('search combines with source filtering and accepts Chinese and case differences', () => {
  const items = studyLibraryItems(own, saved);
  assert.equal(filterStudyLibrary(items, 'all', ' SCHOOL ').length, 2);
  assert.equal(filterStudyLibrary(items, 'saved', 'school').length, 1);
  assert.equal(filterStudyLibrary(items, 'draft', '听写').length, 1);
  assert.equal(filterStudyLibrary(items, 'personal', 'missing').length, 0);
  assert.deepEqual(filterStudyLibrary([], 'all', ''), []);
});
