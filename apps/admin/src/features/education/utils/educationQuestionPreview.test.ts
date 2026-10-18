import { describe, expect, it } from 'vitest';
import { toEducationQuestionPreview } from './educationQuestionPreview';

describe('toEducationQuestionPreview', () => {
  it('projects only student-visible matching content and omits the answer key and rubric', () => {
    const preview = toEducationQuestionPreview({
      prompt: 'Match each term.',
      type: 'matching',
      maxScore: 4,
      objectiveId: 'internal-objective-id',
      gradingRubric: 'internal rubric',
      correctOptionId: 'secret-correct-id',
      correctOptionIds: ['secret-id'],
      correctSequenceIds: ['secret-sequence'],
      matchingPairs: [
        { left: { id: 'left-1', label: 'Cell' }, right: { id: 'right-1', label: 'Basic unit of life' } },
      ],
    });

    expect(preview).toEqual({
      prompt: 'Match each term.', type: 'matching', fillMode: undefined, maxScore: 4,
      options: ['Cell'], matchingTargets: ['Basic unit of life'], explanation: null,
    });
    expect(JSON.stringify(preview)).not.toContain('secret');
    expect(JSON.stringify(preview)).not.toContain('rubric');
    expect(JSON.stringify(preview)).not.toContain('internal-objective-id');
  });

  it('shows option labels without exposing which option is correct', () => {
    const preview = toEducationQuestionPreview({
      prompt: 'Pick one.', type: 'single-choice', maxScore: 1,
      objectiveId: 'objective-1',
      options: [{ id: 'a', label: 'First' }, { id: 'b', label: 'Second' }],
      correctOptionId: 'b',
    });

    expect(preview.options).toEqual(['First', 'Second']);
    expect(Object.keys(preview)).not.toContain('correctOptionId');
    expect(JSON.stringify(preview)).not.toContain('"b"');
  });
});
