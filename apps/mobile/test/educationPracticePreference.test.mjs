import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePracticeFormatPreference } from '../src/features/education/utils/educationPracticePreference.ts';

test('restores every supported education question format preference', () => {
  for (const format of ['all', 'single-choice', 'multiple-select', 'ordering', 'matching', 'true-false', 'fill-blank']) {
    assert.equal(parsePracticeFormatPreference(format), format);
  }
});

test('falls back to all formats for empty or unsupported stored preference', () => {
  assert.equal(parsePracticeFormatPreference(null), 'all');
  assert.equal(parsePracticeFormatPreference('photo-response'), 'all');
  assert.equal(parsePracticeFormatPreference('injected-value'), 'all');
});
