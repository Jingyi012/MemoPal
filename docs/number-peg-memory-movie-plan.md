# Number Peg Memory Movie redesign

Status: **Stage A implemented; Stage B and Stage C remain planned**

This document is the detailed product and implementation direction for the
Number Peg composer. It expands the higher-level decisions in
[`application-design-plan.md`](application-design-plan.md). Stage A is now the
implemented baseline; the Admin content-authority work and optional AI/media
personalization in Stages B and C remain future work.

## 1. Outcome

Replace the current long form of editable, template-generated sentences with
an interactive **Memory Movie Studio**. The creator should actively choose a
concrete interaction between a stable Number Peg anchor and one memory item,
then decide whether to learn it now or return later.

The saved sentence remains a readable fallback, but it is not the primary
learning experience. The primary experience is:

1. see the peg and item;
2. choose a strong interaction;
3. add one memorable sensory exaggeration;
4. preview and save the resulting micro-scene;
5. rehearse and recall it in the separate practice session when ready.

## 2. Product decisions

These decisions should remain stable unless user testing provides contrary
evidence.

### 2.1 Each item has an independent peg association

Do not require the items at pegs 1–10 to form one continuous story.

```text
1 -> Candle -> planet
2 -> Swan   -> milk
3 -> Heart  -> umbrella
```

Seeing peg 2 must recall `milk` directly. The learner must not need to replay
peg 1 first. A continuous story creates failure cascades, makes random access
hard, and becomes fragile when an item is edited or removed.

After all independent scenes are learned, the app may play an optional
**Memory Parade** that moves through them in order. This is an ordered recap,
not a replacement for the independent peg associations.

### 2.2 The item and peg must interact

Merely placing two objects side by side or mentioning that an object moves is
not enough. A useful scene has one unmistakable action with a visible
consequence:

- the planet crushes the candle and hot wax floods the room;
- the candle flame launches the planet like a rocket;
- the candle melts the planet into sticky purple syrup.

Prefer interaction verbs such as crush, wrap, launch, melt, stretch, swallow,
bounce, chase, spray, and explode over generic verbs such as move, appear,
look, or say.

### 2.3 Active choice is part of encoding

The app should suggest scenes, but the learner must select, alter, or create
one. Automatically generating a scene and immediately saving it encourages
passive reading rather than memory formation.

### 2.4 One scene at a time

The composer should present one focused stage instead of rendering all scene
editors in a long vertical list. Progress and completed-scene thumbnails keep
the overall memory visible without turning creation into a form-filling task.

### 2.5 Recall validates scene quality during practice

Do not score a scene by sentence length or number of adjectives. The valid
signal is whether the learner can recall the item from the peg. That signal
belongs to the practice session; it must not block someone who is preparing a
memory now and intends to learn it later.

### 2.6 AI is an enhancement, not a dependency

The composer must always work without an AI or image-generation response.
Use a safe, structured suggestion engine and reusable visual recipes for the
instant experience. A server-generated suggestion or image can improve a
scene later, but failure must fall back silently to the instant experience.

## 3. End-to-end learner flow

### Step 1: Prepare the memory

The shared Memory Composer remains the entry point. The learner supplies a
title, goal, and items, then chooses or accepts the Number Peg recommendation.

Before scene building, check whether the learner knows the required peg
anchors. If not, offer a short anchor match activity. Do not make the learner
repeat onboarding for anchors already marked familiar.

### Step 2: Enter Memory Movie Studio

Show a compact header:

- back;
- `Scene 2 of 6`;
- a small completed/remaining strip.

The main stage shows:

- the number and its stable peg illustration;
- the target item;
- the current visual interaction;
- a one-line caption as supporting copy.

Avoid a large page title and do not show a textarea by default.

### Step 3: Choose what happens

Offer three meaningfully different scene cards, for example:

- **Crash it** — impact or destruction;
- **Transform it** — melt, inflate, freeze, or stretch;
- **Use it strangely** — wear, eat, ride, wrap, or launch it.

Each choice previews its primary action. `Another idea` refreshes the three
choices. `Write my own` opens an advanced text editor without making typing the
default path.

### Step 4: Add one memory booster

Turn the current advice about movement, sound, and texture into an actual
choice. Ask for one optional booster:

- loud;
- sticky;
- hot;
- icy;
- giant;
- tiny;
- smelly;
- funny;
- surprising.

One strong booster is enough. Do not require the learner to complete several
fields or select every sensory category.

### Step 5: Play the micro-scene

Play a two-to-three-second composition made from reusable assets:

- movement preset;
- visual effect;
- short sound effect;
- haptic pattern;
- caption or optional text-to-speech.

Example:

```text
1 · Candle + planet
Animation: a giant planet drops onto the candle
Effect: pink wax splash
Sound: SPLAT
Haptic: one heavy impact
Caption: A giant planet crushes the candle and hot pink wax floods the room.
```

The phone cannot provide real heat, cold, or stickiness. Those qualities are
represented through illustration, motion, wording, and an optional haptic
accent; copy must not imply that the device reproduces the physical sensation.

### Step 6: Save the prepared memory

Once every item has a valid peg and scene recipe, save the memory without
requiring proof of recall. The composer owns authoring and preview only.

After saving, open the new memory's practice session directly in Rehearse.
Opening Rehearse does not create a practice attempt or review schedule; the
user can leave immediately and return from the library later.

### Step 7: Mental rehearsal in the practice session

Rehearse starts with the saved movie and offers replay and scene navigation.
The user can move to Recall when ready; creating the memory does not start a
review schedule or award practice progress.

### Step 8: Recall and encoding check

In Recall, show only the number and peg anchor, then ask for the target item
using the appropriate response for the memory goal:

- spelling: type the exact word;
- concrete list: say, type, or self-reveal the item;
- ordered list: recall the item at that position;
- fact: recall the short answer or key concept.

If incorrect:

1. replay the scene;
2. allow a stronger booster or another scene choice;
3. retry once;
4. mark it for extra rehearsal without changing the saved scene automatically.

### Step 9: Continue or revisit

In the composer, Previous, Next, and the scene strip remain available without
an encoding gate. Scene state should be autosaved as a draft so leaving the app
does not discard completed work.

### Step 10: Finish the first practice

After the learner completes Recall:

- show a compact scene summary;
- offer the optional ordered Memory Parade;
- keep Rehearse and Recall as clearly separate modes;
- show the next scheduled review after completion.

## 4. Screen structure

The intended layout is approximately:

```text
+--------------------------------+
| Back   Scene 2 of 6      dots  |
|                                |
|       interactive stage        |
|   Candle  <action>  Planet     |
|                                |
+--------------------------------+
| Choose what happens            |
| [Crash] [Launch] [Melt]        |
|                                |
| Add a boost                    |
| [Loud] [Sticky] [Giant]        |
|                                |
| Another idea        Play scene |
+--------------------------------+
```

The action area can scroll on small phones, but the active stage, selected
action, and primary button must remain keyboard-safe and reachable. Opening
`Write my own` must reuse the app's measured keyboard-visibility behavior
rather than relying on a fixed device height.

## 5. Scene recipe

A scene should be stored as structured, safe data so it can be replayed. The
mobile client must never execute code received from a suggestion response.

Conceptual recipe:

```ts
type PegSceneRecipe = {
  schemaVersion: 2;
  associationSource: 'suggested' | 'customized' | 'user-written';
  caption: string;
  actionPreset: string;
  visualEffectPreset?: string;
  soundPreset?: string;
  hapticPreset?: string;
  sensoryBoosters: string[];
  targetVisual?: {
    kind: 'emoji' | 'sticker' | 'word';
    value: string;
  };
};
```

The precise transport type should follow the existing typed Memory Set API
pattern when implementation begins. Unknown preset identifiers must degrade to
the caption-only scene instead of failing to open the memory.

The persisted Peg binding should continue to include:

- item position;
- peg number;
- readable scene text;
- whether and how the learner customized the scene;
- the versioned scene recipe.

Any new persisted entity must carry the repository's audit fields, including
`CreatedAt`, `CreatedBy`, `UpdatedAt`, and `UpdatedBy`. User-supplied audit
values are never trusted; the API supplies them from the authenticated user and
server clock.

## 6. Suggestion engine

### 6.1 Instant fallback

The instant engine combines structured traits rather than substituting words
into one sentence template.

Each peg anchor can describe:

- physical traits: hot, sharp, round, flexible;
- natural actions: melt, burn, flap, roll;
- visual parts that can move independently;
- suitable animation, sound, and haptic presets.

The target item can use known semantic or visual traits when available. For an
unknown target, it remains a styled word sticker and still participates in an
action.

Candidate generation should intentionally vary the interaction category, not
only swap synonyms. Repeated requests should avoid returning three versions of
the same action.

### 6.2 Optional server-generated candidates

A future suggestion endpoint may accept:

```text
peg catalogue/version
peg number
target item
memory goal
locale
age-safety mode
excluded previous candidate IDs
```

It should return up to three validated, structured recipes. The API owns
validation, safety filtering, entitlement, timeouts, and provider fallback.
The mobile client owns presentation and local selection state.

Raw memory items, spelling answers, and association text must not be written to
application logs, analytics payloads, or provider-debug logs. Do not cache
private user content in a shared suggestion cache.

### 6.3 Candidate quality rules

A candidate is acceptable when it:

- names both the peg anchor and target;
- includes direct interaction between them;
- uses a specific, imageable action;
- contains a visible consequence;
- adds at most one or two sensory details;
- is short enough to understand in one reading;
- is suitable for the configured age mode;
- can degrade to a caption without custom media.

Reject generic suggestions such as `the candle moves around the planet` or
`imagine the candle saying planet`.

## 7. Visual, sound, and haptic system

Start with a small reusable production set rather than generating a complete
bitmap for every scene.

Initial action presets:

- crash;
- bounce;
- wrap;
- explode;
- melt;
- chase;
- swallow;
- stretch;
- spin;
- launch.

Each preset maps to known mobile assets and motion parameters. Peg illustrations
should use transparent layers when practical. The target uses a known sticker
or emoji when available and expressive typography otherwise.

Sound and haptics reinforce the scene but never carry information that is not
also visible. Support:

- mute;
- sound captions;
- haptics off;
- reduced motion;
- replay;
- no-animation caption fallback.

Full generated scene images are a later experiment. They must not block scene
creation, and they require age-appropriate generation, moderation, consistent
art direction, latency handling, and a deterministic fallback.

## 8. Memory-goal variants

### Spelling

First encode the meaning/image of the word. Then run an exact-letter recall
step. Association recall and spelling accuracy are separate results: remembering
the item but misspelling it is not treated as a total memory failure.

### Grocery and everyday lists

Use the normal visual interaction. Concrete objects should receive object
stickers when available.

### Ordered lists

The peg number already supplies order. Do not add a second sequence mechanic.
Random-access recall should still be tested so the learner does not depend on
reciting from item one.

### Facts

Bind the short answer or key concept to the peg. Do not attempt to animate a
long question and answer paragraph. When content is strongly spatial or has
many connected facts, recommend Memory Palace instead.

## 9. Peg catalogue and 1–100 strategy

The first complete product experience remains the canonical 1–10 Number-Shape
catalogue. Those anchors are stable and versioned; publishing a changed anchor
creates a new catalogue version so existing memories never silently change.

Design data and UI so future packs can extend to 100, but do not require 100
finished illustrations and animations for the first redesign release.

Future expansion rules:

- introduce anchors in groups of ten;
- unlock the next group through anchor familiarity/mastery, not account XP;
- allow the learner to start the next anchor lesson deliberately;
- keep XP rewards cosmetic rather than restricting the core technique;
- never silently truncate, discard, or reuse peg numbers within one memory.

If a learner supplies more items than familiar anchors, explain the choices:

1. learn the next anchor pack; or
2. split the content into clearly named smaller memories.

For the initial 1–10 release, retain the existing product decision not to ship
11–20 until recall testing shows that expansion helps learners.

## 10. Admin requirements

The Admin portal remains the authority for versioned peg content. In addition
to number, localized name, icon/image, and mnemonic description, the future
editor should support:

- physical and visual traits;
- allowed natural actions;
- default animation preset;
- compatible sound and haptic presets;
- locale-specific educational copy;
- age-safety metadata;
- catalogue draft, preview, publish, and version history.

Publishing validates that every anchor in the catalogue has its required
localized content and valid asset references. Existing memories retain the
catalogue version used at creation.

## 11. Rehearse and Recall after creation

Keep these modes visibly distinct.

**Rehearse** shows:

```text
number -> peg -> scene playback -> answer reveal
```

**Recall** shows:

```text
number + peg -> learner response -> feedback
```

An incorrect recall replays the scene, permits one immediate retry, reinserts
the item later in the round, and schedules it earlier than correctly recalled
items. Random-access questions should be mixed with ordered passes.

The optional Memory Parade is part of Rehearse only. Recall must not depend on
watching the entire sequence.

## 12. Progress, XP, and evaluation

Do not award scene-quality XP for pressing `Make it wilder`, selecting more
boosters, or producing longer text. Reward meaningful completion and recall
outcomes according to the app-wide XP rules.

Measure the redesign using privacy-safe aggregate events:

- median creation time per item;
- candidate selection versus custom scene rate;
- scene replay count;
- first-practice encoding-check success;
- next-day recall success;
- composer abandonment point;
- caption-only fallback rate.

Never include the raw item, answer, peg association, or generated caption in
analytics.

## 13. Implementation stages

### Stage A: Core interaction

- replace the scene-editor list with one-at-a-time Memory Movie Studio;
- introduce a small local structured action library;
- add three candidate choices and one sensory booster;
- render reusable movement, sound, and haptic presets;
- keep mental rehearsal and the encoding check in the practice session;
- autosave draft progress;
- persist a versioned scene recipe with caption fallback;
- update Rehearse to replay the selected recipe.

### Stage B: Content authority and quality

- move peg traits and compatible presets into the versioned admin catalogue;
- add Admin preview and publication validation;
- add backend validation and typed contracts for scene recipes;
- add suggestion-quality and fallback tests;
- instrument privacy-safe completion and recall metrics.

### Stage C: Optional personalization

- add safe server-generated candidate recipes;
- adapt suggestions using prior recall outcomes without exposing raw content;
- trial optional generated target stickers or complete scene images;
- decide whether to expand beyond 1–10 using recall evidence.

## 14. First implementation acceptance criteria

The first redesign increment is complete when:

- a learner creates every scene without using a textarea;
- each scene contains direct peg-item interaction and a visible consequence;
- three suggestions are meaningfully different;
- one selected sensory booster changes the playback;
- playback has working accessible fallbacks;
- the learner can save without an encoding check and is taken directly to Rehearse;
- leaving and returning restores the scene draft;
- saved memories reopen with the same peg catalogue and scene recipe;
- Rehearse and Recall remain clearly different;
- a network or suggestion failure does not prevent completion;
- raw memory content does not appear in logs or analytics;
- mobile, API, Admin, migration, and relevant integration tests pass.

## 15. Explicitly out of scope for the first increment

- forcing all 1–10 items into one connected story;
- generating a bitmap or video for every memory item;
- shipping all 100 illustrated anchors;
- allowing account XP to block a core peg needed by the learner;
- rating scenes by text length or adjective count;
- requiring sound, haptics, or animation for accessibility;
- replacing the shared Memory Composer or server-authoritative review schedule.
