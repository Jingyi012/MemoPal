# Review mechanism

The current scheduler keeps per-item intervals of **1, 3, 7, 14, and 30 days**.
Intervals run from the server's UTC completion time, not from the original
learning date. Thirty days is the maximum interval; reviews do not graduate
out of the schedule after a fixed number of sessions.

## Recall outcomes

- Only `recall` changes a schedule. Browsing/rehearsal does not.
- An independent success means `IsCorrect`, `AttemptCount == 1`, and
  `HintCount == 0`. At or after the due time, it advances the main schedule.
- An early independent success records the attempt without advancing the
  stage or moving the due time.
- A final correct answer after retries or hints schedules an independent
  check one day later. It does not advance the earned stage.
- A final incorrect answer (including “I cannot recall it”) schedules
  relearning ten minutes later. It does not erase the earned stage.
- A mature item in relearning first needs an independent recall when due,
  followed by a one-day confirmation. Successful confirmation advances the
  retained stage. For example, a seven-day item that is forgotten follows
  **10 minutes → 1 day → 14 days** if both later recalls succeed.
- A new item has no earned stage. Its first independent success when due
  starts the one-day interval, including after assisted learning.

`ReviewCount` retains earned main-schedule advances, not the total number of
answer attempts or a streak of consecutive successes. `IntervalDays == 0`
marks relearning; its actual due time can be ten minutes or one day later.
No additional persisted state or schema migration is required. Existing
nonzero stages continue in place. Append-only practice history remains intact.

## Within a round

Number Peg hints reveal (1) the saved number-to-image mapping and its
description, (2) the item's saved story with literal answer occurrences
replaced by blanks, then (3) the answer and full story. The current binding's
story takes precedence over its recipe caption and the item's authored hint.
If no usable story is saved, the UI says so instead of repeating a generic
instruction. Text masking handles case, whitespace, Unicode compatibility
forms, and repeated answer words; it does not infer translations or synonyms.

Both Number Peg and Palace recall show corrective feedback and the saved
association after a miss. A missed item, or a Number Peg item answered with
a hint, returns after two other questions where possible. Near the end of a
round it returns at the tail. Each item has at most three answer attempts
(the original question plus two reinforcement visits), so a round can end
even if the user still cannot recall an item.

Answers and per-question hints are hidden again on reinforcement visits.
The aggregate response retains total answer attempts and hint usage. A
later success therefore cannot be counted as a first independent success.
The existing recoverable session snapshot stores the full queue, current
position, and feedback so resuming does not drop reinforcement visits or
mistake a previous answer for the current visit's answer. Rehearsal is
disabled during an active recall round to prevent unrecorded answer exposure.

## Due and overdue

The backend includes every item with `DueAt <= now`, ordered by earliest due
time. Delays do not erase progress or add catch-up repetitions. After a
successful overdue recall, the next interval starts at actual completion.
Home groups items by memory set. Day-based reviews show “Due today” through
the local calendar day and “Overdue” from the next local day; short-term
relearning retains time-based overdue presentation. This label does not
change server eligibility.

The result's next review time is calculated from the updated schedules of
the submitted items. Retrying the same client attempt ID does not reschedule
items or award XP again. Rehearsal does not qualify for due-review XP.

## Validation and later work

Domain tests cover the main interval sequence, early and overdue recall,
assistance, failure, and mature-item recovery. Handler and API tests cover
persisted due times, first-attempt credit, idempotency, and ownership.
Mobile tests cover bounded reinforcement, hidden-hint history, queue recovery,
and local calendar labels. Device smoke testing should include both players,
keyboard submission, “I cannot recall it”, hint reveal, app background/resume,
and save failure/retry.

FSRS, personalized timing, daily workload budgets, and reminder redesign are
future work. The reinforcement spacing and two-retry limit are initial product
choices to evaluate using delayed first-independent-recall accuracy and
practice time, rather than session counts alone.
