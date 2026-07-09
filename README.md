# Leniency

A small, dependency-free browser playground inspired by Lenia. It includes a live field canvas, growth/kernel views, mass tracing, presets, drawing tools, a searchable library from the original Lenia lifeforms, and core parameters for the continuous cellular automata loop.

The large-field playground is in `range-playground.html`. That path is optimized for sparse lifeforms in a big world: simulation runs in a Web Worker, the field is split into 32 x 32 chunks, inactive chunks outside the safe viewport are dropped, field colors use a lookup table, and only dirty chunk patches are uploaded to the visible buffer.

## Run

Open `index.html` directly, or serve the folder:

```powershell
npm run dev
```

Then visit `http://127.0.0.1:5173`.

Open `http://127.0.0.1:5173/range-playground.html` for the optimized large-world version.

## Project layout

```text
Leniency/
  index.html
  package.json
  src/
    app.js
    range-playground.js
    range-sim-worker.js
    lenia-lifeforms.js
    styles.css
```

The simulation is intentionally plain JavaScript so the algorithm is easy to inspect and replace. Favorites are saved in browser `localStorage`.

## Profiling

The optimized playground reports separate timings for:

- `Step sim`: worker-side Lenia convolution and growth update.
- `Colorize`: worker-side dirty chunk conversion through the color lookup table.
- `Buffer`: main-thread `putImageData` updates into the field buffer.
- `Render`: final viewport draw from the field buffer to the screen canvas.

If the radius grows much beyond the current direct-convolution use case, the next major performance step should be a WebGL ping-pong texture implementation. FFT convolution is still likely unnecessary for the current R=13-style kernels.
