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
  isPlatformCourse?: boolean;
}
export interface EducationObjectiveDto {
  id: string;
  courseId: string;
  title: string;
  createdAt: string;
  recommendedMemorySetId: string | null;
  memoryContentType?: EducationMemoryContentType;
  languageCode?: string | null;
  gradeCode?: string | null;
  curriculumCode?: string | null;
  subjectCode?: string | null;
  contentOrigin?: EducationContentOrigin;
  reviewStatus?: EducationContentReviewStatus;
}
export type EducationMemoryContentType = "VocabularyPair" | "OrderedList" | "NumberDate" | "FormulaSymbols" | "CategoryMembership" | "VerbatimText" | "LabelDiagram" | "LanguageItem" | "ConceptUnderstanding" | "ReasoningProcedure" | "NotApplicable";
export type EducationContentOrigin = "Original" | "PublicDomainConfirmed" | "Imported";
export type EducationContentReviewStatus = "Unreviewed" | "TeacherReviewed";
export interface EducationStudyItemAuthorDto {
  id: string; objectiveId: string; stableKey: string; position: number; kind: EducationMemoryContentType;
  primary: string; secondary: string | null; phonetic: string | null; extra: string | null; hint: string | null;
  mediaRef: string | null; languageCode: string | null; status: "Draft" | "Published"; contentVersion: number;
  notConfidentialExamContentConfirmedByUserId: string | null; notConfidentialExamContentConfirmedAtUtc: string | null;
  createdAtUtc: string; updatedAtUtc: string;
}
export interface EducationStudyItemRequest {
  stableKey?: string | null; position: number; kind: EducationMemoryContentType; primary: string;
  secondary?: string | null; phonetic?: string | null; extra?: string | null; hint?: string | null;
  mediaRef?: string | null; languageCode?: string | null;
}
export interface EducationStudyItemImportError { row: number; field: string; reasonCode: string; message: string }
export interface EducationStudyItemImportResult {
  imported: boolean; created: number; updated: number; unchanged: number; rejectedRows: number;
  canImport: boolean; errors: EducationStudyItemImportError[];
}
export interface EducationLearnerStudyItemDto {
  id: string; position: number; kind: EducationMemoryContentType; primary: string; secondary: string | null;
  phonetic: string | null; extra: string | null; languageCode: string | null; contentVersion: number;
  reviewStatus: EducationContentReviewStatus; contentOrigin: EducationContentOrigin;
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
  /** Choice/order items, or the optional public word bank for a fill-in question. */
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
