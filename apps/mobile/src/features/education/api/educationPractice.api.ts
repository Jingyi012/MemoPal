import api from '@/core/api/apiClient';
import type { GeneralResponse } from '@/core/types/general';
import { readEducationAttemptQuestion, type EducationAttemptQuestionDto } from './educationAttempt.api';
import type {
  EducationPracticeItem,
  EducationPublicCourseSummary,
  EducationPublicCourseDetail,
  EducationPublicPracticeAssessment,
  EducationPublicPracticeAnswerResult,
  EducationPublicPracticeHistoryItem,
} from '@/features/education/types/educationPractice.types';
import type { EducationAttemptAnswerDto } from '@/features/education/types/question.types';

type PublicPracticeAssessmentDto = Omit<EducationPublicPracticeAssessment, 'questions'> & Readonly<{
  questions: readonly Readonly<{ question: EducationAttemptQuestionDto; objectiveTitle: string }>[];
}>;

function readData<T>(response: GeneralResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}

export const educationPracticeApi = {
  async getItems(): Promise<readonly EducationPracticeItem[]> {
    const response = await api.get<GeneralResponse<readonly EducationPracticeItem[]>>('/v1/education/practice/items');
    if (!response.data.success || response.data.data == null) {
      throw new Error(response.data.message ?? 'Could not load published practice content.');
    }
    return response.data.data;
  },
  async getPublicCourses(search?: string): Promise<readonly EducationPublicCourseSummary[]> {
    const response = await api.get<GeneralResponse<readonly EducationPublicCourseSummary[]>>('/v1/education/public/courses', {
      params: search?.trim() ? { search: search.trim() } : undefined,
    });
    return readData(response.data, 'Could not load public practice courses.');
  },
  async getSavedCourses(): Promise<readonly EducationPublicCourseSummary[]> {
    const response = await api.get<GeneralResponse<readonly EducationPublicCourseSummary[]>>('/v1/education/public/saved-courses');
    return readData(response.data, 'Could not load your saved courses.');
  },
  async setCourseSaved(courseId: string, isSaved: boolean): Promise<void> {
    const endpoint = `/v1/education/public/courses/${encodeURIComponent(courseId)}/saved`;
    if (isSaved) await api.put<GeneralResponse<{ courseId: string; isSaved: boolean }>>(endpoint);
    else await api.delete<GeneralResponse<{ courseId: string; isSaved: boolean }>>(endpoint);
  },
  async reportCourse(courseId: string, reason: string, details?: string): Promise<void> {
    const response = await api.post<GeneralResponse<{ id: string; courseId: string; reason: string; createdAt: string }>>(
      `/v1/education/public/courses/${encodeURIComponent(courseId)}/reports`, { reason, details },
    );
    readData(response.data, 'Could not send this course report.');
  },
  async getPublicPracticeHistory(): Promise<readonly EducationPublicPracticeHistoryItem[]> {
    const response = await api.get<GeneralResponse<readonly EducationPublicPracticeHistoryItem[]>>('/v1/education/public/practice-history');
    return readData(response.data, 'Could not load your learning history.');
  },
  async clearPublicPracticeHistory(): Promise<number> {
    const response = await api.delete<GeneralResponse<number>>('/v1/education/public/practice-history');
    return readData(response.data, 'Could not clear your learning history.');
  },
  async getPublicCourse(courseId: string): Promise<EducationPublicCourseDetail> {
    const response = await api.get<GeneralResponse<EducationPublicCourseDetail>>(`/v1/education/public/courses/${encodeURIComponent(courseId)}`);
    return readData(response.data, 'Could not load this public course.');
  },
  async getPublicPracticeAssessment(courseId: string, assessmentId: string): Promise<EducationPublicPracticeAssessment> {
    const response = await api.get<GeneralResponse<PublicPracticeAssessmentDto>>(
      `/v1/education/public/courses/${encodeURIComponent(courseId)}/assessments/${encodeURIComponent(assessmentId)}/practice`,
    );
    const dto = readData(response.data, 'Could not load these practice questions.');
    return { ...dto, questions: dto.questions.map(item => ({
      question: { ...readEducationAttemptQuestion(item.question), objectiveTitle: item.objectiveTitle },
      objectiveTitle: item.objectiveTitle,
    })) };
  },
  async checkPublicPracticeAnswer(courseId: string, assessmentId: string, questionId: string,
    answer: EducationAttemptAnswerDto): Promise<EducationPublicPracticeAnswerResult> {
    const response = await api.post<GeneralResponse<EducationPublicPracticeAnswerResult>>(
      `/v1/education/public/courses/${encodeURIComponent(courseId)}/practice-check`,
      { assessmentId, questionId, answer },
    );
    return readData(response.data, 'Could not check this practice answer.');
  },
};
