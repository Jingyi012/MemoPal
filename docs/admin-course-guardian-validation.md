# Course authoring and guardian relationships verification

Verified on 2026-11-08. Scope: Learning Studio course authoring, its knowledge
points/assessments, and guardian relationship management.

## Fixes

- Course details now link back to the course list. Knowledge-point and
  assessment details use the same back-link component and return to the owning
  course, including when opened directly without browser history.
- Import, reorder, delete, memory derivation and memory sync now execute their
  complete operation inside the configured EF execution strategy. Every attempt
  clears tracking and reloads its entities before opening an explicit transaction.
  This preserves rollback and avoids reusing partially staged positions/versions.
- Assessment publication uses a controlled dialog. The former imperative modal
  captured the initial public-practice value, so checking the checkbox still
  submitted `isPublicPractice: false`. The new dialog submits the current choice,
  disables changes while publishing and preserves the choice on failure.
- Guardian management separates the admin verification queue from personal family
  links. Requests use a modal with a labelled learner ID field and retain input
  after failure. Names, searchable IDs, meaningful access states, personal status
  filters and a details drawer replace the two stacked raw-ID tables.
- Pending verification now returns the existing learner-display-name DTO field.
  UI actions follow server permissions: verification requires learner consent;
  revocation is offered only to participants, not unrelated administrators.
  Successful verification closes details as the row leaves the queue.
- Guardian tables use fixed column layout and bounded internal scrolling. At an
  826px viewport the document width remained 826px; action buttons fit the normal
  desktop table and long IDs no longer force columns wider.

No schema migration is introduced by these fixes.

## Reproduction and regression

The PostgreSQL regression was run before the fix and failed with the exact
reported `NpgsqlRetryingExecutionStrategy` user-initiated transaction exception
at `ReorderObjectiveStudyItemsHandler.SaveChangesAsync`.

```powershell
# Set this privately to a local PostgreSQL test connection with CREATE DATABASE permission.
$env:MEMOPAL_CREDIT_TEST_CONNECTION = '<REDACTED>'
dotnet test apps/api/tests/MemoPal.IntegrationTests/MemoPal.IntegrationTests.csproj --configuration Release --filter FullyQualifiedName~Study_item_writes_work_with_Npgsql_retry_strategy
```

The same test now passes. It uses actual Npgsql with retries enabled, introduces
a transient failure between the temporary-position and final-position writes,
checks the exact resulting order and one version increment, then imports changes
and deletes an item while checking the remaining contiguous positions. Each run
creates and drops its own generated test database.

Existing PostgreSQL classroom-query, migration and concurrent memory derivation/
sync tests also run with Npgsql retries enabled. The publication regression was
observed failing with `true` expected / `false` submitted before the dialog fix.

## Coverage

| Area | Verification |
| --- | --- |
| Course list/detail, direct-entry parent navigation | Browser: list → math course → back; knowledge point → course; assessment → course |
| Unit/path editing | Browser: create a unit, associate a knowledge point, save; success message confirmed |
| Study item create/edit, metadata, safe learner preview, publication/retraction | Existing HTTP and admin component suites |
| JSON/CSV import, preflight, invalid input, idempotency and authorization | Existing HTTP/component suites; real PostgreSQL import in retry regression |
| Study item reorder/delete | Real PostgreSQL regression including rollback/retry and final ordering/version checks |
| Assessment revision and publication | Browser: create revision, select public practice, publish, verify public-practice read-only state; component regression checks submitted flag |
| Assessment question modes | Existing question/authoring/guided-practice suites; browser revision loaded all six seeded question modes |
| Classroom course associations and memory recommendations/derivation/sync | Existing HTTP/unit suites and PostgreSQL query/concurrency tests |
| Guardian create/confirm/verify/revoke and authorization | Existing HTTP relationship suite |
| Guardian review names and consent requirements | HTTP assertions for guardian/learner names; UI checks and component tests |
| Guardian search, personal/review separation, details, failed-request persistence | Browser and component tests; duplicate request keeps the entered account ID |
| Guardian approval queue refresh and drawer closure | Browser approval of disposable fixtures and component regression |
| Layout | Browser at normal desktop and 826px; document-width check; screenshot review |

This records automated and manual coverage separately; it is not a claim that
every control in the entire administration portal was manually clicked.

## Final checks

- `npm run check:admin`: build/lint and **69 tests** pass.
- `dotnet build MemoPal.slnx --configuration Release --no-restore`: passes.
- Backend unit suite: **356 passed**.
- Full integration suite with the local PostgreSQL test connection: **133 passed,
  zero skipped**. Focused reruns additionally verify the transient retry/version
  regression and guardian display-name projections.
- `git diff --check`: passes. Existing NuGet audit warnings, Vite chunk-size
  warnings and jsdom/Ant Design test warnings remain outside this change.

## Runtime verification

The user's original 5080 Debug API timed out during read-only probes. It was not
stopped, resumed in its debugger, or replaced. Browser checks used a separate
5082 API, a 5183 frontend preview and a disposable `memopal_course_ui_*` database,
with artificial learner/guardian records. The original app database was not used
for these mutations. Temporary services and that database are removed after QA.

Restart the user's backend with the new code to load the transaction fix in the
normal 5080 environment; an old Debug process cannot gain the fix from a browser
refresh.

Screenshots captured from the final UI:

- `C:/Users/jingy/AppData/Local/Temp/memopal-guardian-redesign.png`
- `C:/Users/jingy/AppData/Local/Temp/memopal-guardian-narrow.png`
- `C:/Users/jingy/AppData/Local/Temp/memopal-course-back-navigation.png`
