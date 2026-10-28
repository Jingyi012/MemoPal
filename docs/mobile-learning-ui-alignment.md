# Mobile learning UI alignment

Design source: [MemoPal 学习模块 UI 定调.html](<MemoPal 学习模块 UI 定调.html>).

## Shared presentation

`apps/mobile/src/features/education/theme/learningTheme.ts` owns the learning
palette and Nunito type weights. Learning components consume this palette,
including headers, action buttons, loading states and supplementary lists.
The light palette follows the HTML; dark colors follow the phone theme.
Small green/red status text is slightly darker than the reference to meet AA.

| Reference element | Native presentation |
| --- | --- |
| Header and AI balance | `LearningHeader` |
| Primary, outline, white and green buttons | `LearningButton`, `LearningAppButton` |
| Subject covers and course hero | `SubjectArtwork`, `learningThemeFor` |
| Knowledge path, status and recommendation pills | `LearningCoursePath` |
| Pink memory invitation | `LearningMemoryCard` |
| Gold memory hero and individual memory entries | `LearningMemoryHero`, `LearningMemoryItem` |
| Correct/incorrect panel | `LearningFeedback` |
| Completion gradient, companion and stars | `LearningResultHero` |
| Single, multiple, judgment, fill, matching and ordering | `question-inputs/` |

Feedback companions participate in normal layout. Explanation scrolling is
bounded independently of the action buttons. Never place a companion or
speech bubble absolutely above the explanation or CTA.

## Validation on 2026-10-28

- Android: opened all six basic question modes using the real native
  presentation components with temporary local fixtures, without submitting
  answers to the API. Inspected selection, matching pairs, ordering chips,
  correct feedback, incorrect feedback and dark mode.
- Android: inspected recommendation pills, memory entries and completion
  components with temporary fixtures. The fixtures and preview route were
  removed, and the original learning route was restored.
- Android: opened the real catalog, course detail and study-content modal.
- `npm run check:mobile`: TypeScript and lint passed; 145 tests passed. Five
  existing warnings remain outside the education feature.
- Expo web production export completed in the system temporary directory.
- Checked 40 light/dark foreground/background pairs against 4.5:1 contrast.

## Word banks and post-check answers

Fill-in questions can use their existing `options` collection as a word bank;
the mobile read mapper exposes it as `wordBank`. No database migration is
needed. Existing questions without options retain keyboard input.

In Learning Studio, open the course assessment, edit a draft fill-in question,
and select **Student input → Tap a word bank option**. Add 2–12 choices, with
at least one accepted answer. Save and publish the draft. Published
assessments require a revision draft; their frozen content is not changed.
The server validates the bank using the same case, whitespace and numeric
tolerance rules as grading.

Public practice, guided learning and published assignment-review checks now
return a typed `correctAnswer`. Question/session GETs do not expose that
field. Feedback uses server choice IDs to distinguish correct selections,
missed correct options and selected distractors. Incorrect feedback shows
the correct answer before the explanation, including order and matching
labels. The answer is kept only in the current feedback state.

Extension checks: 148 mobile tests, 47 admin tests, 334 backend unit tests;
integration coverage includes all objective answer shapes, word-bank
round-trip, no answer leakage before checking, ownership and replay.
