# Admin Education i18n backlog

Updated 2026-10-26. The Admin portal now has a lightweight language provider and centralized education dictionaries in `apps/admin/src/i18n/adminLanguage.tsx` and `apps/admin/src/features/education/i18n/educationMessages.ts`. It supports `zh-Hans` and `en`, defaults from browser language, and persists an explicit choice in local storage.

The inventory below is the remaining Education UI work outside this slice. Counts are a source scan tally of JSX lines containing direct English UI text (`rg -n '>[[:space:]]*[A-Za-z][^<{]*<'`), not a count of unique phrases; dynamic status labels and interpolated values need manual review during each follow-up.

| File | Remaining literal-bearing lines | Focus |
|---|---:|---|
| `apps/admin/src/features/education/pages/EducationHomePage.tsx` | 20 | workspace overview, capability cards, invitation states |
| `apps/admin/src/features/education/pages/ClassroomDetailPage.tsx` | 3 | member fallback/status wording outside the translated course-link section |
| `apps/admin/src/features/education/pages/EducationCourseReportsPage.tsx` | 9 | report review, moderation actions and explanations |
| `apps/admin/src/features/education/components/EducationAssignmentGradebook.tsx` | 7 | grade release, corrections, retakes and error states |
| `apps/admin/src/features/education/pages/EducationAssessmentPage.tsx` | 4 | assessment versioning, question loading and draft actions |
| `apps/admin/src/features/education/components/EducationQuestionEditor.tsx` | 6 | question authoring and answer input controls |
| `apps/admin/src/features/education/components/ClassroomAssignments.tsx` | 5 | classroom assignment authoring and task states |
| `apps/admin/src/features/education/components/FamilyAssignments.tsx` | 5 | family practice and verified-child assignment flow |
| `apps/admin/src/features/education/components/ManualResponseGradingCard.tsx` | 5 | manual grading and feedback |
| `apps/admin/src/features/education/components/EducationQuestionPreviewCard.tsx` | 4 | learner input preview hints |
| `apps/admin/src/features/education/components/RelationshipForms.tsx` | 4 | classroom creation, invitation and guardian request forms |
| `apps/admin/src/features/education/pages/GuardianRelationshipsPage.tsx` | 2 | guardian confirmation and verification |
| `apps/admin/src/features/education/pages/EducationLayout.tsx` | 2 | portal navigation and sign out |
| `apps/admin/src/features/education/pages/EducationCoursesPage.tsx` | 1 | course list action |
| `apps/admin/src/features/education/components/EducationObjectiveMemoryRecommendationEditor.tsx` | 1 | legacy recommendation save action |
| `apps/admin/src/features/education/components/EducationMatchingPairsEditor.tsx` | 1 | matching-pair editor action |
| `apps/admin/src/features/education/components/ClassroomObjectiveProgress.tsx` | 1 | progress error state |
| `apps/admin/src/features/education/components/EducationResponseAudio.tsx` | 1 | audio response status |
| `apps/admin/src/features/education/components/EducationQuestionPreviewModal.tsx` | 1 | student preview modal |
| `apps/admin/src/features/education/components/EducationRetakeModal.tsx` | 1 | retake authorization |
| `apps/admin/src/features/education/components/EducationResponsePhoto.tsx` | 1 | photo response status |
| `apps/admin/src/features/education/components/EducationResourceCreateButton.tsx` | 1 | generic create form |

The scan reports 85 remaining candidate JSX lines. Follow-up implementation should migrate whole screens and their related error, empty, modal, and accessibility text together, then add dictionary key parity coverage. The course knowledge-point/learning-content and classroom-course association wording in `EducationCoursePage.tsx`, `ClassroomDetailPage.tsx`, `QueryState.tsx`, and the StudyItem editor was migrated as part of the current slice; remaining literals on these screens are tracked above. Assessment and gradebook text remains separate work.
