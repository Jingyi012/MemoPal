# Momo — MemoPal's growing companion

`generate.mjs` authors the editable vector rig in `scene.rml`. The ten artboards
`Momo 01`–`Momo 10` correspond to account levels 1–10; later levels retain stage
10. These are cosmetic representations of the server-owned account level.
Playing the memory duet does not award XP or unlock a level.
The pearl quest is another local mini-game: four matching pairs, one hint and
combo feedback. Neither game creates XP or bond points. The companion hub's
daily review card reads the server's `todayPracticeCount`.

The `Momo Icon` artboard uses the level-two hatchling for the app icon. The source
design follows the supplied orange-and-pearl goldfish growth reference.

The **Momo Companion** state machine has three layers:

- Continuous water motion, five independently animated tail petals and bubbles.
- Eight interruptible reactions, blended into the full character rig.
- A separate blink timeline, so the face remains alive during other gestures.

The actor uses layered pearlescent fins, wide-spaced eyes, a small smile and a
smooth body without scale texture. `assets/pearl-body.png` is an original transparent body
painting embedded as an `ImageAsset`; Rive still animates the complete rig, its
independent fins, eyes and expressions. The hub places it over a vector reef.

All double keyframes specify cubic easing explicitly. RML defaults to hold.
The `Momo Controls` view model exposes `hello`, `pet`, `dance`, `highFive`,
`correct`, `encourage`, `celebrate`, and `think` triggers. Both native and web
actors load the same file and fire those triggers. Reduced motion pauses playback;
screen blur/backgrounding also pauses it. Text feedback remains available.

## Rebuild

From this directory, with the official Rive CLI on PATH:

```sh
node generate.mjs
rive . --verify
rive inspect . --summary
rive . --once
```

Copy `build/memopal-momo.riv` to `momo.riv` only after checking the rendered states.
Native Rive requires the rebuilt Expo development client, not Expo Go.

After updating `momo.riv`, run `node export-portraits.mjs` to render transparent
512×512 portraits for the ten profile-avatar levels. The script uses local Chrome
or Edge and writes matching assets to the mobile bundle and API static assets.

```sh
rive . --screenshot=build/hatchling.png --artboard="Momo 02" --advance=30
rive . --screenshot=build/pet.png --artboard="Momo 04" --data=pet=true --advance=36
rive . --screenshot=build/legendary.png --artboard="Momo 10" --advance=60
```

Stage thumbnails in `previews/` use a 240×220 viewport with contain fit. The app
icon is rendered from `Momo Icon` at 1024×1024. No Rive scripts or account-bound
assets are embedded; the file uses standard images, vector shapes, timelines
and data binding.
# Archived goldfish rig

The app now renders Momo from the shaded level-specific manta-ray poses in
`apps/mobile/assets/images/momo-levels/`. This directory keeps the earlier
goldfish Rive source for reference; it is not loaded by the mobile runtime.

