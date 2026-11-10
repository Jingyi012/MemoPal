# Product UI redesign — delivery audit

Source: user goal-objective.md, 2026-11-09, with follow-up requirements dated 2026-11-10. The implementation and phone-size review are delivered; runtime coverage and native-only limits are stated explicitly below.

Latest additions: user objective `38a0b6a5-635a-41df-944b-2d480977fe98/goal-objective.md`, 2026-11-10. Prioritizes scene-card geometry, direct course browsing from Learn, reusable collection/item cards, white surfaces instead of large flat pastel cards, a distinct Home greeting without a large page title, plain header icons with gray press feedback, a game-like AI wallet, and non-error accents for Number Peg.

## Reviewed inventory

Inspected the complete Expo route inventory, feature screen inventory, current tab layout, HomeScreen, LearningDashboardScreen, Learn/Library/Discover wrappers, public course catalog, community memory browser, shared card surfaces, AnimatedPressable, AppButton, ConfirmModal and CustomBottomSheetModal. Existing community functionality includes public memory browsing, search, filters, bookmark, copy, public details and leaderboards; there is no existing post/comment feed to invent. Remaining detail screens and secondary modal consumers require visual review.

## Architecture chosen

| Tab | Responsibility | Destinations |
| --- | --- | --- |
| Home | Welcome, level, daily next step, recent activity | Continue, tasks, review, recommendations |
| Learn | Own and saved study materials | Cards, course path, assignments, creation |
| Memory | Memory collections and spaces | Palace, number pegs, folders, review, creation |
| Community | Shared resources and social exploration | Public memories, course discovery, leaderboard, authoring |
| Me | Account and personal configuration | Profile, referrals, reports, settings |

Discover is a dedicated stack screen reached from Community and Home. Study sessions and memory-method screens are stack children with a back button and no bottom tabs. Restricted learner visibility must remain enforced.

## Reference principles

- [Notion official navigation](https://www.notion.com/en-gb/help/intro-to-workspaces): Home brings attention back to relevant work and tasks. Applied as a distinction between daily overview and the content workspace.
- [Duolingo official guide](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo/): learning paths and practice form clear learning destinations. Applied to keeping the learning path inside the course.
- Existing MemoPal community and artwork remain the foundation; no fabricated popularity or social activity.

## Evidence / remaining gates

| Requirement | Current status | Required completion evidence |
| --- | --- | --- |
| Home versus Learn responsibilities | Implemented / phone-size verified | Stages 1, 4, 8: greeting, daily goal, continuation versus the personal learning workspace |
| Memory discoverability | Implemented / phone-size verified | Stages 5–7: independent tab, spaces, collections, shared item cards and review entry |
| Community restoration | Implemented / phone-size verified | Stages 1–3: actual shared-memory browser, discovery and leaderboard; existing handlers retained |
| Attractive Discover | Implemented / phone-size verified | Stage 2: real recommendations, recent releases, covers, catalog and search |
| Minimal cards / hidden destructive actions | Implemented / phone-size verified | Stages 1, 6, 7, 9: whole-card entry, menus, list/grid, cancellation |
| Icon hierarchy | Implemented / reviewed | Stages 3, 8, 9: shared plain 44pt header actions; immersive scene controls retain contrast |
| Confirm dialog sizing | Implemented / phone-size verified | Stages 1, 3, 6: proportionate shared dialog and retained cancellation |
| Sheet overlay | Implemented / phone-size verified | Stages 2, 3, 8, 9: independent backdrop, drag dismissal, input compatibility and hidden controls |
| Consistent system | Shared components/tokens applied | Learning, memory, discovery, account and secondary screens covered across stages; authored imagery retained |
| Preserve functionality | Contracts/handlers retained; checks pass | Route audit and relevant automated suites passed. Destructive, paid and upload mutations were not submitted in UI QA |
| Phone sizes / safe areas | Expo Web 360/390px verified | Native keyboard, permissions, purchases and VoiceOver/TalkBack remain release qualification limits |

The historical stages below describe the evidence available at each point. Earlier “remaining” lists are superseded by the final coverage notes, rather than claims that every server mutation has been manually exercised.

## Stage 1 verification

- `npm run check:mobile`: TypeScript passed, 196 tests passed, 5 pre-existing lint warnings.
- Android production Expo export succeeded (temporary output, no build assets committed).
- 390×844 Expo Web: five tabs visible; Learn opens own/saved courses and tasks; card overflow opens management, removal opens a compact confirmation, cancel retains the data.
- Memory card long press opens the existing copy/visibility/archive/move/delete sheet. No mutation was submitted.
- Community opens public resources, bookmark/filter/search and leaderboard remain visible; course gateway opens `/discover` with back and no bottom navigator.
- Restricted-account guards retained in feature entry wrappers. Device-native and screen-reader interaction remain unverified.
- Independent scrim/panel implementation verified by code; motion timing and all bespoke sheet consumers still require review.

## Stage 2 implementation and evidence

- Discover now groups actual course data into preference-based recommendation, publishedAt-sorted recent courses, and the complete catalog. Recommendations use the existing preference matcher and communicate fallback. No popularity metrics are fabricated.
- Reusable `LearningCourseCover` uses existing subject artwork, authored titles and theme roles. No bitmap assets or dependencies added.
- Community has a memory-specific hero and distinct course/leaderboard links while preserving the actual shared-memory feed, search/filter/save and public detail interactions.
- Catalog and community cards have no duplicate visible start/open CTA.
- All former `animationType="slide"` Modal consumers now use independently animated scrim and sheet. The panel now starts outside the actual screen height, including tall filter panels. Gesture/screen-reader QA is still pending.
- 360px Expo Web visual checks: recommended cover, horizontal course rail, search with three actual English results, community hero and feed visible without overlap.
- `npm run check:mobile` passed 196 tests before final sheet-height adjustment; repeat validation follows. Native phone QA, remaining detail-screen review and the full functionality regression checklist are still open.

## Stage 3 implementation and evidence

- Consolidated LearningHeader into the common app header. Focused pages use an 18px title and main tabs 26px, a shared 44px icon target and one accessory/action layout. HeaderIconButton supports selected and disabled states.
- Added reusable ActionMenuSheet and ScreenActionDock. Public memory detail moves bookmark to header, share/report to its menu, and copy/open to a non-overlapping dock. Helpful reactions and reporting are preserved. Course detail uses the same action menu.
- Private course header exposes create-a-copy, accurately matching the existing authoring behavior (ready-course source creates a new set rather than mutating the original).
- Replaced bespoke modal gesture implementation with a controlled adapter around existing CustomBottomSheetModal. It reuses independent library backdrop, pan-to-close, theme and hardware-back support. Long scrolling consumers specify a capped height; compact menus size dynamically.
- Browser QA found a real gorhom web compatibility issue: its internal StyleSheet.compose receives a variadic style array. Flattened the adapter's style to one object, preventing the crash; verified course filters display with footer actions afterwards.
- 390px Expo Web: public-memory hero, creator, stats, preview and persistent main action render without overlap; menu opens and dragging its handle down closes it. Course filter opens and all sections/footer are visible. No share/report/copy/delete mutations were submitted.
- Remaining: native gesture/screen-reader QA; root home daily-goal coverage; creation-flow review; other feature-detail visual and functionality audit. This is still partial progress against the full objective.

## Stage 4 implementation and evidence

- Home now has an adjustable daily memory-practice goal (1/3/5) stored in the existing user preference state. Completion derives from server PracticeStats for the current UTC date; it is explicitly a memory goal and does not count opening cards, award XP or change scheduling. Unknown/error counts do not report completion.
- Memory creation has a contextual help sheet beside its title, focused header, larger explanatory text and simpler technique cards. Study creation reuses the same reduced-border surface and common header. Generic learning surfaces and buttons use shallower depth tokens.
- 390px QA: home goal/menu visible; new-content sheet routes to both creators; study creator basics → enter material → preview → edit unit → edit-word sheet → back → unsaved confirmation → discard returned to Learn. No server content was created. Memory creator help opens with three concise steps.
- Feature-preservation audit found GuardianRequests was left reachable only through the retired HomeScreen. Restored it under Assignments → Invitations & account with the original query/mutation handlers. Home pending-invitation notice routes directly to the expanded section; classroom invitation controls remain.
- `/education/assignments?connections=1` renders the expanded invitation/account section at 390px. Empty-account state verified; real pending-guardian mutation not submitted.
- Final `check:mobile`: 196 tests passed, TypeScript passed. Native keyboard/OCR capture, native goal settings and pending relationship mutation QA are still unverified.
- Remaining finite audit: profile/settings/referral, Palace and Number Peg workspaces and sessions, reports/leaderboard/support/auth, dark mode and global route/link regression. Completion remains unproven.

## Stage 5 — workspaces and theme

- Memory has direct Palace / Number Peg entry cards, respecting existing module flags. Palace journeys use a whole-card action and chevron; the peg list reuses the on-demand filter menu.
- Migrated active scan, Palace editor / study components, peg familiarity / map, referral, notifications and subscription presentation to existing dynamic theme roles. Auth text/surfaces now follow semantic colors. No OCR, purchase, reward or progress rules changed.
- Me exposes the AI wallet beside referrals. CommonHeader now opts into the wallet only where it supports the focused task.
- At 390×844, opened both memory workspaces, scene library, familiarity questions, referral and wallet. Tested dark referral and peg screens; restored the original light preference. No paid generation, reward redemption, upload or invitation mutation submitted.
- Added support-form scrolling / keyboard avoidance and accessible field labels. Family report surfaces match the shallower learning-card treatment.
- Progress is now a stack destination (`/progress`); legacy achievements redirects to it. Legacy Practice redirects to `/memory-tools`, with its back button and no bottom tabs. Updated fallbacks/session returns and leaderboard practice links accordingly.
- Verified Me → wallet → back, Me → progress → practice, practice → due review, leaderboard → score-help dialog → dismiss. No answers or competition preference changes submitted.

## Stage 6 — explicit follow-up fixes

- Scene grid: percentage widths had been applied to both the animation wrapper and its inner pressable. Fixed relative-dimension allocation in shared AnimatedPressable: the outer slot resolves the percentage once and its inner pressable fills that slot. All consumers reuse this correction. At 390px, a scene button measures approximately 174×164px; selection routes to creation with the selected scene ID. Lock gates retained.
- Learn now visibly offers Browse courses before the library. Verified Learn → Discover → back returns to Learn, without requiring Community.
- Collections now use `LearningLibraryCardSurface`, also used by learning and memory items. Collection details render the exact same `MemoryLibraryItemCard` as the Memory root, including covers, status, overflow/long-press menu and list/grid layouts. Grid mode applies to collections too, and fills paired cards to equal height.
- Collection detail creation moved from a floating overlay to the header. Its delete and visibility confirmations use shared ConfirmModal instead of native-only alerts. Opened delete confirmation and cancelled; records retained.
- White/default theme surfaces replace large flat pastel cards in workspace shortcuts, collection covers, course discovery covers/catalog headers, invitations and memory-method introductions. Small status/selection accents and subject artwork remain colored; authored Palace photos and primary heroes retain their visual identity.
- Phone QA: 390px scene grid, Learn browse/back, collection root/detail, list/grid switching and confirmation cancel. Restored the original grid preference. Native keyboard, camera/OCR, hardware-back, screen-reader and purchase UI remain device-only checks; no claim of native verification.

## Broader validation for this revision

- `npm run check`: mobile TypeScript/lint and 196 tests passed; admin production build/lint and 70 tests passed. Five existing mobile lint warnings remain.
- Default solution build encountered DLL locks from the user's running Visual Studio/API. Rebuilt the solution with an isolated temporary `--artifacts-path`: 0 errors; existing dependency/nullability warnings remain. User services were not stopped.
- API unit tests: 356 passed. Integration tests: 138 passed, 6 skipped (Postgres-specific environment gates).
- Android production export passed. Final white-surface mobile check passed 196 tests and Android production export passed; shared relative-dimension check also passed 196 tests; 360px scene buttons measure approximately 159×164px and render in two columns.
- Full redesign remains active: native interaction checks and final cross-screen visual review have not been proven complete.

## Stage 7 — memory details, forms and feedback

- Memory detail separates identity / description, the next action, optional progress rules and the item directory. Draft setup is above the directory. Identical prompt/answer text is displayed once; draft labels use a neutral purple state. Loading retains a back button.
- Collection name/edit forms now use the same AppBottomSheet with BottomSheetScrollView / BottomSheetTextInput. Corrected its primary label to Create collection rather than Create memory. No create/update mutation submitted during UI QA.
- RecallAnswerCard and RecallResultCard retain game feedback/confetti but use default surfaces. Both allocate a normal-flow slot for Momo so long prompts/titles cannot render under its absolute positioning. Result icons now follow the active theme instead of importing the fixed light palette.
- At 390px, opened actual ready and draft memory details; verified the next action and de-duplicated directory. Also rendered the actual shared answer/result components in a temporary isolated UI harness: correct peg answer, wrong Palace answer, long completion text, light and dark. These were component-state checks, not server-scored attempts; no XP/progress changes made. The temporary route was removed afterwards and light mode restored.

## Stage 8 — latest Home/header/wallet/peg direction

- Removed the large Home page-title bar. Home now starts with Momo, plain notification/create controls, then the user greeting and level progress. Library/catalog data and next-action selection are unchanged.
- HeaderIconButton has no constant border/fill; shared AnimatedPressable supports a transient pressedStyle using the common neutral-gray controlPressed role. LearningIconButton and workspace creation use the same plain default. Notification uses the app's centralized icon family. Touch targets remain 44pt.
- Added a reusable AiCreditToken for the wallet, balance card and compact counter. Wallet uses a game-currency balance composition while retaining server-owned totals, costs, expiry, history and purchase availability. Unknown balances display an unavailable mark rather than a fabricated zero. Generation kinds have human-readable labels.
- Number Peg's normal counts, rehearsal, hint controls, recall headers and familiarity badges use violet; due-task text uses success green. Wrong answers, save errors and failed operations keep semantic red. No scoring, hint accounting, session recovery or billing rules changed.
- 390px screenshots verified the new Home header, actual six-digit AI balance, and Number Peg list. Back buttons are visibly transparent. Press feedback wiring is verified in shared code; timing/feel still needs native device verification.
- Remaining audit: secondary companion/reward/predefined-content screens and the final route/feature regression matrix, plus the previously listed native-only interactions. The complete product objective remains active.

## Stage 8 regression evidence

- Source audit found 65 Expo routes and checked 137 literal router/Redirect navigation references: no unresolved literal destinations. Dynamic IDs and mutation results still require their feature-specific runtime coverage; this is not proof of all route parameters.
- Form fill/cancel testing found a real Web crash in Gorhom BottomSheetTextInput's blur handler (`currentlyFocusedInput` is absent from RN Web). Added AppSheetTextInput: native uses Gorhom keyboard integration, Web uses RN TextInput. Both collection and draft-word sheets reuse it. Reloaded, filled a collection name and cancelled successfully; original two collections retained and no error overlay appeared.
- Header/wallet revision passed TypeScript, lint (five baseline warnings), 196 mobile tests and Android production export. Final Web-input compatibility checks passed: TypeScript/lint (five baseline warnings), all 196 mobile tests, and Android production export. Temporary preview route is absent from the final source tree.
- Application inventory did not show a running Android emulator window. This turn's phone-size QA remains Expo Web; native keyboard, permission and screen-reader checks were not performed.

## Stage 9 — secondary screens and final coverage

- Predefined memory collections and standalone lessons now reuse LearningLibraryCardSurface, matching personal study materials and memory-library cards. The legacy MemoryLearningCard is a thin adapter; its routes, labels, management callback, long press and review label remain. Read-only catalog cards do not show a management menu. Collection/download/search behavior is retained.
- Rewards history replaces three persistent filter chips with the reusable choice sheet. Loading keeps the page header/back action. Failed queries have retry and preserve successfully loaded records; failure no longer masquerades as an empty reward history. The range note distinguishes 30-day XP from lifetime achieved milestones.
- Companion closet/studio metadata is readable at 12px and above, theme-aware item details no longer use a fixed white fill, loading/error screens retain a back action, and the closet's idle animation respects reduced motion. Games use the common transparent back control and theme-aware status bar.
- Saved outfit deletion moves into long press / overflow, followed by shared ConfirmModal. Replacing an unsaved preview also uses ConfirmModal. Naming an outfit uses AppBottomSheet, BottomSheetScrollView and the native/Web-compatible AppSheetTextInput; existing create/equip/delete hooks remain authoritative.
- Companion growth drawer uses a separate fading scrim. Closed controls are removed from the accessibility tree and are not touchable. Premium and leaderboard-rules close actions also use HeaderIconButton.
- 390px UI checks: predefined collection → contained courses; rewards all → milestones; closet and studio rendering; profile → subscription management → back. 360×740 checks: game entry → in-game introduction → back to playground, companion growth panel open/close, closed-panel accessibility, dark catalog and dark studio. Restored the original Follow system theme.
- The current account has no supported saved full-body outfit preview. Outfit save/equip/delete mutations were reviewed in source and typechecked, but were not exercised against user records. No test fixture or placeholder outfit was added to the product.
- Final mobile check: TypeScript passed, lint passed with the same five baseline warnings, 196 tests passed. Android production export succeeded. git diff --check passed. The earlier complete workspace, isolated .NET build and API test results remain applicable; this stage changes mobile presentation only.

## Final coverage and limits

| Flow | Evidence |
| --- | --- |
| Home → next action, daily goal, Learn → browse → back | Phone-size UI navigation / preference and activity tests |
| Personal/saved study workspace, list/grid, management and create preview | UI navigation, form fill/cancel and authoring/ordering tests; no deletion submitted |
| Memory root → collection → item, Palace scene selection, Number Peg setup | Phone-size UI; common card/layout and route audit; no paid generation |
| Course paths / quiz feedback and recall feedback | Existing guided-learning/answer tests, component-state phone previews; no new scored attempt submitted |
| Community resources → detail / Discover / leaderboard | Real-data UI navigation; preserved save/copy/share/report handlers; no public publication or report submitted |
| Account → wallet / referral / progress / settings | Phone-size UI, theme restoration; existing subscription/reward contracts retained |
| Preset catalog / rewards / companion wardrobe and games | Stage 9 UI and source checks as described above |
| Route integrity | 65 routes; 137 literal navigation references audited with no unresolved literal destination. Dynamic IDs depend on real server data |

No iOS/Android device was available for native keyboard, camera/OCR capture, permission prompts, hardware-back gestures, purchases or VoiceOver/TalkBack. Expo Web checks at phone dimensions do not assert those native behaviors. Automated checks and source preservation also do not constitute manual verification of every mutation. No user services were stopped, no user content was deleted, and no new package dependency was introduced by this redesign.
