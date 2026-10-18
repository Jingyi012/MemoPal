import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEducationPracticeHistoryShareSummary, buildEducationShareSummary } from '../src/features/education/utils/educationShareSummary.ts';

const labels = {
  completed: (count, formats) => `Completed ${count} questions${formats ? ` (${formats})` : ''}.`,
  privacyNote: 'Participation only; no answers or score.',
  questionTypes: {
    'single-choice': 'multiple choice', 'multiple-select': 'multiple select', ordering: 'ordering', matching: 'matching',
    'true-false': 'true/false', 'fill-blank': 'fill-in', 'written-response': 'written response', 'photo-response': 'photo response', 'voice-response': 'voice response',
  },
};

test('education share summary contains only question count, formats, and the privacy note', () => {
  const summary = buildEducationShareSummary(['single-choice', 'single-choice', 'written-response'], labels);

  assert.equal(summary, 'Completed 3 questions (2 multiple choice, 1 written response).\nParticipation only; no answers or score.');
  assert.doesNotMatch(summary, /answer text|correct answer|student name|score:\s*\d|assignment-id/i);
});

test('education share summary handles an empty format list without exposing other attempt data', () => {
  assert.equal(buildEducationShareSummary([], labels), 'Completed 0 questions.\nParticipation only; no answers or score.');
});

test('practice history share contains only a recent activity count and privacy note', () => {
  assert.equal(buildEducationPracticeHistoryShareSummary(12, {
    summary: count => `I revisited ${count} questions in my recent learning practice.`,
    privacyNote: 'No course names, question content, answers, or correctness are shared.',
  }), 'I revisited 12 questions in my recent learning practice.\nNo course names, question content, answers, or correctness are shared.');
});

test('practice history share normalizes invalid counts', () => {
  const labels = { summary: count => `Recent practice: ${count}`, privacyNote: 'Private details stay private.' };
  assert.equal(buildEducationPracticeHistoryShareSummary(-3, labels), 'Recent practice: 0\nPrivate details stay private.');
  assert.equal(buildEducationPracticeHistoryShareSummary(Number.NaN, labels), 'Recent practice: 0\nPrivate details stay private.');
});
