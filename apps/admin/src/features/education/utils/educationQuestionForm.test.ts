import { describe, expect, it } from 'vitest';
import { toEducationQuestionRequests, type AssessmentFormValue } from './educationQuestionForm';

describe('toEducationQuestionRequests', () => {
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
