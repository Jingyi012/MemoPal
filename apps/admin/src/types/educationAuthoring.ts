export type EducationQuestionType =
  | "single-choice"
  | "multiple-select"
  | "ordering"
  | "matching"
  | "true-false"
  | "fill-blank"
  | "written-response"
  | "photo-response"
  | "voice-response";
export type EducationFillMode = "text" | "number";

export interface EducationCourseDto {
  id: string;
  title: string;
  createdAt: string;
  isPublic: boolean;
  publiclyPublishedAt: string | null;
}
export interface EducationObjectiveDto {
  id: string;
  courseId: string;
  title: string;
  createdAt: string;
  recommendedMemorySetId: string | null;
}
export interface EducationOptionDto {
  id: string;
  label: string;
}
export interface EducationMatchingPairDto {
  left: EducationOptionDto;
  right: EducationOptionDto;
}
export interface EducationQuestionDto {
  id: string;
  prompt: string;
  explanation: string | null;
  type: EducationQuestionType;
  fillMode: EducationFillMode | null;
  maxScore: number;
  objectiveId: string;
  options: EducationOptionDto[];
  correctOptionId: string | null;
  correctOptionIds: string[];
  correctSequenceIds: string[];
  matchingPairs: EducationMatchingPairDto[];
  correctBooleanAnswer: boolean | null;
  allowedTextAnswers: string[];
  trimTextAnswers: boolean;
  ignoreCase: boolean;
  allowedNumericAnswers: number[];
  numericTolerance: number;
  gradingRubric: string | null;
}
export interface EducationAssessmentDto {
  id: string;
  courseId: string;
  title: string;
  status: "draft" | "published";
  version: number;
  publishedAt: string | null;
  isPublicPractice: boolean;
  questions: EducationQuestionDto[];
}
export type EducationQuestionRequest = Omit<EducationQuestionDto, "id"> & {
  id?: string | null;
};
