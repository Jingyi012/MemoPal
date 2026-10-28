import { describe, expect, it } from 'vitest';
import { toEducationQuestionRequests, type AssessmentFormValue } from './educationQuestionForm';

describe('toEducationQuestionRequests', () => {
  it('persists explicitly enabled fill word banks and omits stale options in keyboard mode', () => {
    const question = { prompt: 'A seed grows a ___', type: 'fill-blank' as const, fillMode: 'text' as const,
      maxScore: 1, objectiveId: 'objective', allowedTextAnswers: 'root',
      options: [{ id: 'a', label: 'root' }, { id: 'b', label: 'flower' }], fillUseWordBank: true };
    expect(toEducationQuestionRequests({ title: 'Quiz', questions: [question] })[0].options).toEqual(question.options);
    expect(toEducationQuestionRequests({ title: 'Quiz', questions: [{ ...question, fillUseWordBank: false }] })[0].options).toEqual([]);
  });
  it.each(['written-response', 'photo-response', 'voice-response'] as const)(
    'preserves the grading rubric for %s questions', type => {
      const request = toEducationQuestionRequests({
        title: 'Assessment',
        questions: [{ prompt: 'Explain', type, gradingRubric: 'Award points for accurate reasoning.', maxScore: 5, objectiveId: 'objective-1' }],
      } as AssessmentFormValue);

      expect(request[0].gradingRubric).toBe('Award points for accurate reasoning.');
    },
  );

  it('omits grading rubrics from automatically graded questions', () => {
    const request = toEducationQuestionRequests({
      title: 'Assessment',
      questions: [{ prompt: 'Choose', type: 'single-choice', gradingRubric: 'should not be sent', maxScore: 1, objectiveId: 'objective-1' }],
    } as AssessmentFormValue);

    expect(request[0].gradingRubric).toBeNull();
  });
});
