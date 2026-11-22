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
- [ ] M3 — Effects + Phase 2
- [ ] M4 — Front end (Phase 4)
- [ ] M5 — Rear + drivetrain (Phases 3, 5)
- [ ] M6 — Cage, body, brakes, electrical (Phases 6–8)
- [ ] M7 — Finish (Phase 9), finale, mobile polish

## Layout

`src/engine/stepEngine.ts` — opening step N resets to stock, runs `apply()` for every action of steps 0…N-1, then builds step N's GSAP timeline. Each action (`src/engine/actions/*`) implements `play(tl, a, ctx)` and `apply(a, ctx)`. Parts live in `src/model/` (origin on each part's real pivot), named points/seams in `src/model/anchors.ts`, step data in `src/steps/data/`.
