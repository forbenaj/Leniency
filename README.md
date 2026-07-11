# Leniency

![Lifeform preview](./assets/lifeforms/lifeform-4-o2-a.png)

Leniency is a dependency-free browser laboratory for Lenia-style continuous cellular automata. It ships with two interfaces that share the same catalogue and rule model:

- `index.html` is a compact, guided playground with field, growth, kernel, mass trace, presets, and brush tools.
- `range-playground.html` is an immersive large-world editor with CPU Worker and WebGL backends, layers, compatible rule groups, game-style navigation, and versioned map files.

The application uses plain JavaScript, HTML, and CSS. There is no production build step and no third-party runtime dependency.

## Run locally

Node.js 18 or newer is used for project scripts and tests. Python is used only for the local static server command.

```powershell
npm run dev
```

Then open:

- `http://127.0.0.1:5173/` for the compact playground.
- `http://127.0.0.1:5173/range-playground.html` for the large-world playground.

The compact page can also be opened directly from disk. The range playground must be served over HTTP because it loads a Web Worker and compatibility data.

## Controls

Both playgrounds support pointer, touch, and keyboard operation. Buttons expose their selected and running states to assistive technology, and all controls have visible keyboard focus.

Compact playground shortcuts:

- `Space`: run or pause.
- `R`: reset the selected preset.
- `N`: randomize the field.

Range playground shortcuts:

- `Space`: run or pause when focus is outside a form control.
- `Enter`: commit a pending lifeform placement.
- `Escape`: cancel placement, close a dialog, or exit game mode.
- `W`, `A`, `S`, `D`: move in game mode.

## Architecture

```text
index.html
  lenia-core.js ── shared codec, rules, curves, palettes
  lifeform-catalog.js ── catalogue normalization and compatible groups
  simple-sim.js ── compact typed-array simulation engine
  app.js ── compact UI orchestration and rendering

range-playground.html
  shared core/catalogue/map modules
  range-playground.js ── UI, viewport, layers, and backend controller
  range-sim-worker.js ── chunked CPU simulation
  webgl-sim.js ── WebGL2 ping-pong texture simulation
```

Generated catalogue arrays remain separate from application logic. `assets/lifeforms/` contains deterministic previews produced by the image-generation script.

The CPU range backend divides the field into 32 × 32 chunks, keeps activity metadata per layer, and transfers only dirty color patches. The WebGL backend packs up to three layers into float textures and falls back to the Worker backend when the model or device cannot support it.

## Map files

Range maps are versioned JSON documents containing the world dimensions, normalized model configuration, and Base64-encoded `Float32` layer data. Loading validates the format, dimensions, channel/rule limits, encodings, decoded lengths, and finite cell values before application state is changed. The current world limit is 2048 × 2048 with up to three layers.

Treat map files as data, not scripts. Malformed, oversized, or unsupported files are rejected with an in-app status message.

## Development commands

```powershell
npm test                 # Run the Node test suite
npm run check:syntax     # Parse every JavaScript source, script, and test
npm run check            # Syntax checks plus the full test suite
npm run generate:lifeforms
npm run extract:lifeforms
```

`extract:lifeforms` reads `Python/animals.json` from a local Lenia checkout. Set `LENIA_REPOSITORY` when the checkout is not adjacent to this project:

```powershell
$env:LENIA_REPOSITORY = "D:\path\to\Lenia"
npm run extract:lifeforms
```

`generate:lifeforms` rebuilds deterministic PNG previews from the bundled, compatible-extra, and repository catalogues.

## Verification

The automated suite covers:

- ZIP, ZIP2, CSV, and RLE cell decoding.
- Rule parsing, kernel/growth math, and catalogue normalization.
- Every bundled lifeform and generated preview reference.
- Compatible-group reconciliation.
- Map validation and round trips.
- Worker wrapping and snapshot behavior, including kernels larger than the world.

Before shipping a change, run `npm run check` and verify both pages at desktop and phone breakpoints. WebGL behavior should be checked on a WebGL2-capable browser as well as with the CPU backend forced.

## Project data

Research references and the strict compatibility grouping source are stored in `docs/`. Sample maps live in `assets/maps/`. Generated files identify their source script in their header; edit the generator or source data instead of hand-editing generated catalogue output.
