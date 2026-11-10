# Referral AI credit rewards

Invitations now grant AI credits instead of new XP. Per the product decision,
the numerical amounts stay the same. Premium-day rewards are unchanged.

| Reward | Default AI credits |
| --- | ---: |
| Inviter, per successful referral | 80 |
| Invitee, once on redemption | 40 |
| First invitation milestone | 100 |
| Three invitations milestone | 250 |
| Five invitations milestone | 500 |
| Ten invitations milestone | 1000 |

The first successful invitation therefore grants the inviter **180** credits
(80 base + 100 milestone). Each milestone is awarded once. Existing disabled
program, referral-cap, self-referral and one-redemption-per-user rules still apply.
Credits enter the existing wallet as non-expiring `referral` grants, with
`referral-reward` ledger entries. These use normal AI generation allocation,
charge and refund behavior. No new XP event or level increase is created.

## Configuration and compatibility

Configure amounts at **Admin → Referral Program → Reward Config**
(`/admin/referrals/config`). The referral configuration tab in System Settings
uses the same normalized endpoint, including its JSON editor.

Old stored configuration amounts (`inviterRewardXp`, `inviteeRewardXp`, milestone
`rewardXp`) become the same number of credits for future redemptions when the
new credit property is absent. Explicit zero credit rewards stay zero. Saving
the configuration persists the new fields. Old XP reward labels are cleared so
the UI generates the correct credit description.

Historical XP awards are neither reversed nor converted into wallet credit.
Historical milestones remain awarded and show their original rewards; changing
the reward type does not let users claim an old milestone twice. Old XP fields
remain in backend responses for historical data/compatibility, while new awards
return zero XP. New fields are typed in mobile and Admin clients:

- Config/records: `inviterRewardAiCredits`, `inviteeRewardAiCredits`.
- Milestones: `rewardAiCredits`.
- Summary: `totalAiCreditsEarned`; Admin users: `totalAiCreditsAwarded`.
- Redemption result: `inviterAwardedAiCredits`, `inviteeAwardedAiCredits`.

The mobile referral screen refreshes wallet queries after redemption or a new
referral notification. The wallet displays invitation rewards in its history.

## Persistence and rollout

Migration **20261108074641_AddReferralAiCreditRewards** adds three integer columns
with zero defaults to referral records and milestone rewards. It does not
backfill past rewards or mutate existing wallet balances.

Redemption records, new milestone awards, wallet grants, ledger entries and
notifications are staged in the same context and committed by one SaveChanges.
Existing unique indexes on referee, milestone, credit reference and ledger
reference/kind prevent a second persisted award. The standalone credit service
is not called during staging because it starts its own transaction and clears
the change tracker.

Restart the backend with the new build to run the configured startup migrations
before using the updated mobile/Admin clients. The Visual Studio-owned Debug
API was not stopped or replaced by this task. Build/test verification used
Release configuration to avoid its locked Debug DLLs. The migration was generated
and reviewed but was not applied to the user's running database during this task.

## Verification

- Mobile check: 181 tests, typecheck/lint pass (existing lint warnings remain).
- Admin check: build/lint and 63 tests pass.
- Solution Release build passes.
- Backend unit tests cover one-for-one legacy settings, zero rewards,
  capped referrals, historical XP preservation, summary amounts and replay.
- HTTP integration test redeems a code, checks both wallet balances/history,
  rejects replay/self-referral and non-admin config access, and reserves/refunds
  real wallet credits with test-only metering; no external AI provider is called.
- PostgreSQL-only tests require their dedicated test connection and were skipped
  in this environment. Native-device invitation UI was not exercised.
