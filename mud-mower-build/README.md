# Mud Mower Build

An interactive 3D, step-by-step build animation for converting a vintage garden tractor into a lifted mud mower. Built from `BUILD_SPEC.md` (Vite + TypeScript + three.js + GSAP; all geometry procedural, no network assets).

## Run

```
npm install
npm run dev        # open the printed link
npm run validate   # step-data checks + apply() pass for every step prefix
npm run build      # static site in dist/ (relative paths: GitHub Pages / Netlify / phone)
```

Keys: ←/→ step · Space play/pause · R restart · F free cam. Deep link: `#step=2.1`.

## Status

- [x] **M1 — Skeleton:** scene, floor, lights, camera presets, step engine (random access, scrubber, speed, auto-advance, deep links), remove / install / weld (tack + full bead, sparks, cooling), highlight / ghost / show / hide / note, callouts, UI shell (step list, tabs with persisted Done-when checks, toggles, donor picker, mobile layout). Three demo steps use box placeholders.
- [x] **M2 — Stock tractor + Phase 0–1:** full JD 112-style stock model (rounded/squared hood by donor, weathered paint), shop props, six-donor turntable lineup, steps 0.1–1.10 transcribed from Part E. New actions: measure, laser, angleGauge, bolt (socket + bag-and-tag tray), drill (persistent holes), grind / wireWheel (rust → bare steel), fluid drain/fill, plus extensions `move`, `rotate`, `trace`, `mist`, `xray`, `wrap`, `donorLineup` (listed in `src/steps/types.ts`). Anchors live in the space of a part (default the tractor), so they follow it onto jack stands.
- [x] **M3 — Effects + Phase 2:** `grindCut` (cut-off disc, spark stream, glowing kerf, the cut piece drops and goes to scrap), `grind` on a part (sweep to bare steel) or on anchor spots (flush), weld beads with tack dots every ~6 in, 1-in stitch welds (`stitch: [1, 3]`), multi-segment seams, and a faint heat tint. Frame parts (box plates with drain holes, engine / front-suspension / rear crossmembers, double-shear apex bracket, panhard tab, front clip + plate + tow hole) and steps 2.1–2.5.
- [x] **M4 — Front end (Phase 4):** beam built on the bench, knuckles from an exploded layout (Exploded toggle on 4.2/4.3), hubs, wishbone + panhard, coilovers with a flex test over a rock, steering chain, Ackermann sweep with live inside/outside angles and Ackermann lines, alignment.
- [x] **M5 — Rear + drivetrain (Phases 3, 5):** transaxle explode/service (donor-dependent swap), 3 in drop, hubs/discs/mud tires, v2 swingarm demo, Predator 420, CVT whose belt re-wraps as the ratio shifts, Layout A driveline, throttle, fuel, exhaust + snorkel.
- [x] **M6 — Cage, body, brakes, electrical (Phases 6–8):** cage from the hood template, bumper / guard / skid, ROPS + rider clearance check, flares + floorboards, foot brake, cutting-brake pivot turn, kill tether, harness, lights at dusk.
- [x] **M7 — Finish (Phase 9):** mock-up drive, strip-down + paint with presets, final assembly with the original hood back on the cage, pre-ride checklist, CVT tuning, mud-course finale with "Replay full build".

## Notes / TODO(Noah)

Places where Part E / B2 couldn't be followed literally are marked `TODO(Noah)` in the code:
- **Steering lock:** with B2's geometry (25-in tire 4 in outboard of a kingpin at X ±12, rails at ±6.5) the inside tire hits the frame past ≈ 31°, so the animated lock is 30° (outer ≈ 24°). `npm run validate` sweeps full lock × ±14° flex and fails on any tire–frame contact. The 4.7 text still says 40–45° as written.
- **Front beam height:** B2's beam center (world 14.5) is inside the frame rails; modeled 1 in lower.
- **Driven pulley / pitman position:** moved slightly so the jackshaft runs between the rails and the pitman clears the panhard tab.
- **Engine width:** narrower than a real Predator 420 so it fits inside the 17-in hood with the cage.
- **Driver camera:** raised for the +4 in stance.

## Layout

`src/engine/stepEngine.ts` — opening step N resets to stock, runs `apply()` for every action of steps 0…N-1, then builds step N's GSAP timeline. Each action (`src/engine/actions/*`) implements `play(tl, a, ctx)` and `apply(a, ctx)`. Parts live in `src/model/` (origin on each part's real pivot), named points/seams in `src/model/anchors.ts`, step data in `src/steps/data/`.
