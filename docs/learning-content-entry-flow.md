# Learning creation and optional memory support

Learning remains the main task. Creating material and selecting memory tools
have explicit destinations.

## Entry points

- Learning header **+** → Create study content.
- Memory library **+** → memory content editor → Palace or Number Peg.
- Memory library **Memory tools** → general tools hub.
- Knowledge-point recommendations and learning completion retain contextual
  memory help. The public course catalogue no longer ends with unrelated tools.

## Mobile creation wizard

The supplied three-step design is implemented with the learning palette,
shared button/icon components, and feature-local styles in `learningDraftStyles`.
No image assets or dependencies were added.

1. **Basics**: name, content language, and input/paste/scan method.
2. **Add words**: editable named unit cards, word chips, per-unit input/paste/scan,
   and add/delete unit actions. Tapping a word opens a bottom sheet to edit its
   word/meaning, move it to another or a new unit, or delete it.
3. **Preview**: named unit summaries in learning order, long-press drag sorting,
   accessible up/down alternatives, edit/add unit, save and start privately, or keep a draft.

No automatic five-word split is used by the mobile wizard. The user decides
which words belong together. All units need at least one word before saving.
The existing total limit is 50 unique words; meanings remain optional.
Empty or duplicate input remains available for correction. Pending typed words
are committed and validated when advancing to preview rather than discarded.

The title's question-mark opens a scrollable help sheet. Unsaved exit protection
and server errors remain visible. Scan hand-off preserves the full unit editor
and pending inputs in the existing in-memory OCR draft store. Only new scanned
words are added to the selected unit; cancellation restores the editor.

## Saved structure and compatibility

The import endpoint accepts either legacy `entries` with optional `groupSize`,
or explicit `units` with names and entries. Supplying both is rejected. The API
validates titles, nonempty units, global duplicates and the 50-word total.
Each unit is persisted as a real course unit with its own knowledge point,
study cards and eligible written-recall questions. Supplied order is preserved.
The retry identity includes names, membership and order for explicit units.
Legacy list/grouping requests retain their version-2 identity. Reordering or
renaming units creates a separate import; existing courses are not overwritten.
No database migration is needed.

The Admin list importer remains compatible: keep together by default, or select
1–50 entries per unit. Existing edits and authoring destinations are unchanged.
The generated course stays private. Personal learning needs no public
publishing or workspace visit. Review and explicit assignment remain separate
steps when sharing with a child or class. Dictation and speech scoring are not generated.

## Product references

- [Duolingo Practice tab](https://blog.duolingo.com/guide-to-duolingo-practice-hub/):
  targeted practice is separate from the main learning path.
- [Anki notes and cards](https://docs.ankiweb.net/getting-started.html): source
  content can support different learning activities without forcing all editors
  into one workflow.

## Validation for the three-step redesign

- Mobile type/lint check and 187 tests passed; five existing lint warnings remain.
- Release solution build, 356 unit tests and 132 integration tests passed.
  Six PostgreSQL-only tests were skipped without the optional test connection.
- Admin build/lint passed. The full test run passed 69 tests and timed out on
  one content-library test; that file passed all six tests when rerun alone.
- Android production bundle export passed.
- Existing Android emulator visually verified basics, adding a word with Enter,
  word count/chip update, opening/dismissing the edit/move sheet, and preview.
  Scan/camera permissions, keyboard layouts and drag sorting still need broader
  native device coverage. No course was saved into the user's database in this
  smoke test; persistence was exercised through integration tests.
- The API running under Visual Studio must be restarted to load the extended
  named-unit request contract.

## Save failure caused by a stale development API

The live Debug API rejected the named-unit payload twice with HTTP 400 and a
model-validation error requiring `Entries`. Its running process predated the
named-unit contract. A fresh build and restart of the existing Visual Studio
API session loads the correct contract; no flattening fallback is used, so unit
names and membership cannot silently disappear. The editor now distinguishes
this legacy-contract rejection from timeouts, connection failures, forbidden
accounts, unavailable drafts and invalid content. It keeps entered content and
never displays raw server stack traces. Mobile checks cover these error states.

After the restart, retrying the user's existing draft from the Android emulator
reached the saved confirmation: one unit and seven cards. The draft was saved
privately, without changing its word grouping. `npm run check:mobile` passed
with 189 tests; five pre-existing lint warnings remain. Debug API build passed.
The rejected minimal HTTP probes created no diagnostic courses.

## Personal learning, readiness and drafts

The default mobile action is **Save and start learning**. `startLearning: true`
marks cards and generated assessments usable privately; it never sets course
public visibility, a public publication timestamp or public-practice visibility.
The owner-only `/v1/education/my-courses` list and detail return only the current
user's private imported content. Another user cannot read it or start its guided
session. Existing public discovery endpoints remain unchanged.

The learning home has **My study content**. Ready items open their study cards
and existing guided practice, while drafts reopen the three-step editor. Words
without a separate clue still have useful study cards and no invented quiz.
Their completion screen does not promise a non-existent practice session.

**Save a draft for later** keeps materials in draft status. `sourceDraftId`
allows an owned draft to be resumed: unchanged content is promoted in place;
changed content creates a new import and archives the superseded private draft
in the same save. Retrying the same request preserves its result. Ready courses
cannot be archived through this draft-edit operation, preserving learning
records. Merely opening a saved draft does not trigger an unsaved-edit warning.
No database migration is needed.

Personal-learning validation: solution Debug/Release builds passed, mobile checks
passed 189 tests, backend unit tests passed 356, and integration tests passed 135
(six optional PostgreSQL-only cases skipped). The Android emulator verified the
home entry, loading an existing seven-card draft into the editor, both save
actions on preview, and automatic navigation into card 1/7 after saving for
personal learning. The existing draft was promoted rather than duplicated.
The local Visual Studio API was rebuilt and restarted with this contract.

The editor hydrates a saved draft once and then owns local form state. It stops
background refetching that source ID, because saving an edited draft can archive
that old ID. Refocusing the app therefore does not replace edits or produce a
spurious error for a superseded draft. The initial loading/error states remain
explicit, and user/account switching still uses separate query keys and editors.

Admin build and lint also passed. The normal high-concurrency test run had four
5-second timeouts under local load; all 70 Admin tests passed when rerun with
`--maxWorkers=2 --testTimeout=15000`. No repository test-timeout setting was
changed. Focused owner/draft tests were rerun after excluding deleted objectives
from private readiness/count calculations and all ten passed.
