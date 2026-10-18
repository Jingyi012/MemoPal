export interface EducationObjectiveEvidenceDto {
  assessmentId: string;
  assessmentTitle: string;
  assignmentTitle: string;
  questionId: string;
  questionPrompt: string;
  questionType: string;
  submittedAt: string;
  score: number;
  maxScore: number;
}

export interface EducationObjectiveMasteryDto {
  objectiveId: string;
  objectiveTitle: string;
  courseId: string;
  courseTitle: string;
  status: 'insufficient-evidence' | 'needs-revalidation' | 'selected-response-only' | 'currently-strong' | 'continue-practice' | 'needs-support';
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  distinctQuestionCount: number;
  distinctAssessmentCount: number;
  distinctSubmissionDateCount: number;
  selectedResponsePerformance: EducationQuestionTypePerformanceDto;
  openResponsePerformance: EducationQuestionTypePerformanceDto;
  evidence: EducationObjectiveEvidenceDto[];
}

export interface EducationQuestionTypePerformanceDto {
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  distinctQuestionCount: number;
  distinctAssessmentCount: number;
  distinctSubmissionDateCount: number;
}

export interface EducationStudentObjectiveProgressDto {
  studentUserId: string;
  studentName: string;
  objectives: EducationObjectiveMasteryDto[];
}

export interface EducationClassroomObjectiveProgressDto {
  classroomId: string;
  windowStart: string;
  generatedAt: string;
  students: EducationStudentObjectiveProgressDto[];
}
