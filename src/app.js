(() => {
  "use strict";

  const core = window.LeniaCore;
  const catalog = window.LifeformCatalog;
  const simulationApi = window.LeniaSimpleSim;
  if (!core || !catalog || !simulationApi) {
    const message = "Leniency could not start because its shared core scripts were not loaded.";
    console.error(message);
    const stateLabel = document.querySelector("#stateLabel");
    if (stateLabel) stateLabel.textContent = "Unavailable";
    return;
  }

  const { SimpleSimulation, chooseWorldSize } = simulationApi;

  /** Return a required DOM element or fail with an actionable boot error. */
  function required(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required element: ${selector}`);
    return element;
  }

  const fieldCanvas = required("#fieldCanvas");
  const growthCanvas = required("#growthCanvas");
  const kernelCanvas = required("#kernelCanvas");
  const traceCanvas = required("#traceCanvas");
  const fieldCtx = fieldCanvas.getContext("2d", { alpha: false });
  const growthCtx = growthCanvas.getContext("2d", { alpha: false });
  const kernelCtx = kernelCanvas.getContext("2d", { alpha: false });
  const traceCtx = traceCanvas.getContext("2d", { alpha: false });
  if (!fieldCtx || !growthCtx || !kernelCtx || !traceCtx) throw new Error("2D canvas rendering is unavailable.");

  const ui = {
    libraryCount: required("#libraryCount"),
    catalogue: required("#Catalogue"),
    animalList: required("#AnimalList"),
    animalWindow: required("#AnimalWindow"),
    selectedForm: required("#selectedForm"),
    runBtn: required("#runBtn"),
    stepBtn: required("#stepBtn"),
    resetBtn: required("#resetBtn"),
    clearBtn: required("#clearBtn"),
    randomBtn: required("#randomBtn"),
    presetSelect: required("#presetSelect"),
    paintBtn: required("#paintBtn"),
    eraseBtn: required("#eraseBtn"),
    sampleBtn: required("#sampleBtn"),
    brushSlider: required("#brushSlider"),
    brushValue: required("#brushValue"),
    brushPowerSlider: required("#brushPowerSlider"),
    brushPowerValue: required("#brushPowerValue"),
    sizeSelect: required("#sizeSelect"),
    radiusSlider: required("#radiusSlider"),
    radiusValue: required("#radiusValue"),
    alphaSlider: required("#alphaSlider"),
    alphaValue: required("#alphaValue"),
    muSlider: required("#muSlider"),
    muValue: required("#muValue"),
    sigmaSlider: required("#sigmaSlider"),
    sigmaValue: required("#sigmaValue"),
    dtSlider: required("#dtSlider"),
    dtValue: required("#dtValue"),
    gainSlider: required("#gainSlider"),
    gainValue: required("#gainValue"),
    decaySlider: required("#decaySlider"),
    decayValue: required("#decayValue"),
    fpsCapSlider: required("#fpsCapSlider"),
    fpsCapValue: required("#fpsCapValue"),
    stepsSlider: required("#stepsSlider"),
    stepsValue: required("#stepsValue"),
    paletteSelect: required("#paletteSelect"),
    stateLabel: required("#stateLabel"),
    fpsLabel: required("#fpsLabel"),
    timeLabel: required("#timeLabel"),
    massLabel: required("#massLabel"),
    growthLabel: required("#growthLabel"),
    energyLabel: required("#energyLabel"),
    sampleLabel: required("#sampleLabel"),
  };

  const presets = [
    { id: "orbium", name: "Orbium seed", size: 64, radius: 10, mu: 0.07, sigma: 0.035, dt: 0.025, seed: "orbium" },
    { id: "drifter", name: "Drifter ring", size: 64, radius: 9, mu: 0.09, sigma: 0.04, dt: 0.03, seed: "ring" },
    { id: "nebula", name: "Soft nebula", size: 128, radius: 18, mu: 0.11, sigma: 0.055, dt: 0.025, seed: "nebula" },
    { id: "smooth", name: "SmoothLife-ish", size: 64, radius: 8, mu: 0.31, sigma: 0.049, dt: 0.06, seed: "speckles" },
  ];

  const palettes = {
    aurora: [[5, 7, 9], [17, 40, 42], [54, 130, 124], [149, 214, 107], [240, 193, 90], [236, 115, 94], [164, 140, 240]],
    ember: [[7, 7, 8], [39, 23, 21], [103, 45, 35], [183, 79, 53], [239, 155, 74], [244, 214, 124], [242, 239, 205]],
    mono: [[4, 5, 5], [22, 27, 27], [48, 59, 58], [85, 104, 101], [137, 158, 151], [196, 210, 202], [244, 246, 241]],
  };

  const simulation = new SimpleSimulation({ size: 96, rule: { ...core.DEFAULT_RULE, radius: 10 } });
  let libraryForms = [];
  let formsById = new Map();
  let formsByIndex = new Map();
  let selectedFormId = null;
  let selectedAnimalItem = null;
  let isRunning = false;
  let brushMode = "paint";
  let brushSize = Number(ui.brushSlider.value);

  /** Persistent low-resolution surface scaled into an existing visible canvas. */
  class RasterSurface {
    constructor(canvas, context) {
      this.canvas = canvas;
      this.context = context;
      this.buffer = document.createElement("canvas");
      this.bufferContext = this.buffer.getContext("2d", { alpha: false });
      if (!this.bufferContext) throw new Error("Unable to create a canvas render buffer.");
      this.image = null;
      this.size = 0;
    }

    ensureSize(size) {
      if (this.size === size && this.image) return;
      this.size = size;
      this.buffer.width = size;
      this.buffer.height = size;
      this.image = this.bufferContext.createImageData(size, size);
    }

    draw(values, paletteLut, multiplier = 1, offset = 0) {
      this.ensureSize(simulation.size);
      const pixels = this.image.data;
      for (let index = 0; index < values.length; index += 1) {
        const paletteIndex = Math.round(core.clamp(values[index] * multiplier + offset) * 255);
        const source = paletteIndex * 3;
        const target = index * 4;
        pixels[target] = paletteLut[source];
        pixels[target + 1] = paletteLut[source + 1];
        pixels[target + 2] = paletteLut[source + 2];
        pixels[target + 3] = 255;
      }
      this.bufferContext.putImageData(this.image, 0, 0);
      this.context.imageSmoothingEnabled = false;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(this.buffer, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /** Dirty-view renderer that reuses image buffers and a 256-entry palette LUT. */
  class PlaygroundRenderer {
    constructor() {
      this.fieldSurface = new RasterSurface(fieldCanvas, fieldCtx);
      this.growthSurface = new RasterSurface(growthCanvas, growthCtx);
      this.kernelSurface = new RasterSurface(kernelCanvas, kernelCtx);
      this.paletteLut = new Uint8ClampedArray(0);
      this.kernelScratch = new Float32Array(0);
      this.dirty = new Set(["field", "growth", "kernel", "trace", "metrics"]);
      this.setPalette(ui.paletteSelect.value);
    }

    setPalette(name) {
      this.paletteLut = core.createColorLut(palettes[name] || palettes.aurora);
      this.mark("field", "growth", "kernel");
    }

    mark(...views) {
      for (const view of views) this.dirty.add(view);
    }

    markAll() {
      this.mark("field", "growth", "kernel", "trace", "metrics");
    }

    renderKernel() {
      const cellCount = simulation.size * simulation.size;
      if (this.kernelScratch.length !== cellCount) this.kernelScratch = new Float32Array(cellCount);
      else this.kernelScratch.fill(0);
      const center = Math.floor(simulation.size / 2);
      const { offsetX, offsetY, weights } = simulation.kernel;
      let maximum = 0;
      for (let index = 0; index < weights.length; index += 1) {
        const x = center + offsetX[index];
        const y = center + offsetY[index];
        if (x < 0 || x >= simulation.size || y < 0 || y >= simulation.size) continue;
        const target = y * simulation.size + x;
        this.kernelScratch[target] += weights[index];
        maximum = Math.max(maximum, this.kernelScratch[target]);
      }
      this.kernelSurface.draw(this.kernelScratch, this.paletteLut, maximum > 0 ? 1 / maximum : 0);
    }

    renderTrace() {
      const width = traceCanvas.width;
      const height = traceCanvas.height;
      traceCtx.clearRect(0, 0, width, height);
      traceCtx.fillStyle = "#060808";
      traceCtx.fillRect(0, 0, width, height);
      traceCtx.strokeStyle = "#35413a";
      traceCtx.lineWidth = 1;
      for (let row = 0; row <= 4; row += 1) {
        const y = (height / 4) * row;
        traceCtx.beginPath();
        traceCtx.moveTo(0, y);
        traceCtx.lineTo(width, y);
        traceCtx.stroke();
      }
      if (simulation.massTrace.length < 2) return;
      traceCtx.strokeStyle = "#f0c15a";
      traceCtx.lineWidth = 3;
      traceCtx.beginPath();
      simulation.massTrace.forEach((value, index) => {
        const x = (index / Math.max(1, simulation.massTrace.length - 1)) * width;
        const y = height - core.clamp(value, 0, 0.35) * (height / 0.35);
        if (index === 0) traceCtx.moveTo(x, y);
        else traceCtx.lineTo(x, y);
      });
      traceCtx.stroke();
    }

    renderMetrics() {
      ui.massLabel.textContent = simulation.metrics.mass.toFixed(3);
      ui.growthLabel.textContent = simulation.metrics.growth.toFixed(3);
      ui.energyLabel.textContent = simulation.metrics.energy.toFixed(3);
      ui.timeLabel.textContent = simulation.simTime.toFixed(1);
    }

    drawKeyboardCursor() {
      if (document.activeElement !== fieldCanvas) return;
      const cellWidth = fieldCanvas.width / simulation.size;
      const cellHeight = fieldCanvas.height / simulation.size;
      fieldCtx.save();
      fieldCtx.strokeStyle = "#f8d477";
      fieldCtx.lineWidth = Math.max(2, Math.min(cellWidth, cellHeight) * 0.35);
      fieldCtx.strokeRect(
        keyboardCursor.x * cellWidth,
        keyboardCursor.y * cellHeight,
        cellWidth,
        cellHeight,
      );
      fieldCtx.restore();
    }

    flush() {
      if (this.dirty.has("field")) {
        this.fieldSurface.draw(simulation.field, this.paletteLut);
        this.drawKeyboardCursor();
      }
      if (this.dirty.has("growth")) this.growthSurface.draw(simulation.growth, this.paletteLut, 0.5, 0.5);
      if (this.dirty.has("kernel")) this.renderKernel();
      if (this.dirty.has("trace")) this.renderTrace();
      if (this.dirty.has("metrics")) this.renderMetrics();
      this.dirty.clear();
    }
  }

  const renderer = new PlaygroundRenderer();
  let framePending = false;
  let lastAnimationAt = null;
  let stepAccumulator = 0;
  let fpsClock = performance.now();
  let simulatedFrames = 0;
  const pendingPaintPoints = [];
  let lastPaintPoint = null;
  const keyboardCursor = { x: Math.floor(simulation.size / 2), y: Math.floor(simulation.size / 2) };

  function scheduleFrame() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(animationFrame);
  }

  function requestRender(...views) {
    renderer.mark(...views);
    scheduleFrame();
  }

  function reportError(context, error) {
    console.error(context, error);
    setRunning(false);
    ui.stateLabel.textContent = "Error";
    ui.stateLabel.title = error instanceof Error ? error.message : String(error);
  }

  function runSafely(context, action) {
    try {
      return action();
    } catch (error) {
      reportError(context, error);
      return undefined;
    }
  }

  function flushPointerEdits() {
    if (!pendingPaintPoints.length) return;
    const points = pendingPaintPoints.splice(0);
    if (brushMode === "sample") {
      const point = points[points.length - 1];
      const sample = simulation.paintAt(point.x, point.y, { mode: "sample" });
      ui.sampleLabel.textContent = Number(sample).toFixed(3);
      return;
    }
    const power = Number(ui.brushPowerSlider.value);
    for (const point of points) simulation.paintAt(point.x, point.y, { mode: brushMode, radius: brushSize, power });
    simulation.measure();
    renderer.mark("field", "metrics");
  }

  function animationFrame(now) {
    framePending = false;
    flushPointerEdits();

    if (isRunning) {
      if (lastAnimationAt == null) lastAnimationAt = now;
      const elapsed = Math.min(250, Math.max(0, now - lastAnimationAt));
      lastAnimationAt = now;
      const targetMs = 1000 / Math.max(1, Number(ui.fpsCapSlider.value));
      stepAccumulator += elapsed;
      if (stepAccumulator >= targetMs) {
        stepAccumulator = Math.min(targetMs, stepAccumulator - targetMs);
        simulation.step(Number(ui.stepsSlider.value));
        simulatedFrames += 1;
        renderer.mark("field", "growth", "trace", "metrics");
      }
      if (now - fpsClock >= 500) {
        ui.fpsLabel.textContent = String(Math.round((simulatedFrames * 1000) / (now - fpsClock)));
        simulatedFrames = 0;
        fpsClock = now;
      }
    }

    renderer.flush();
    if (isRunning || pendingPaintPoints.length) scheduleFrame();
  }

  function setRunning(value) {
    isRunning = Boolean(value);
    ui.runBtn.textContent = isRunning ? "Ⅱ" : "▶";
    ui.runBtn.setAttribute("aria-label", isRunning ? "Pause simulation" : "Run simulation");
    ui.runBtn.setAttribute("aria-pressed", String(isRunning));
    ui.stateLabel.textContent = isRunning ? "Running" : "Paused";
    ui.stateLabel.title = "";
    lastAnimationAt = null;
    stepAccumulator = 0;
    simulatedFrames = 0;
    fpsClock = performance.now();
    if (!isRunning) ui.fpsLabel.textContent = "0";
    if (isRunning) scheduleFrame();
  }

  function setBrushMode(mode) {
    brushMode = mode;
    for (const [button, buttonMode] of [[ui.paintBtn, "paint"], [ui.eraseBtn, "erase"], [ui.sampleBtn, "sample"]]) {
      const active = mode === buttonMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  /** Expand a range when catalogue data exceeds its original editing bounds. */
  function setRangeValue(input, value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    const minimum = Number(input.min);
    const maximum = Number(input.max);
    const step = positiveStep(input.step);
    if (Number.isFinite(minimum) && number < minimum) input.min = String(Math.floor(number / step) * step);
    if (Number.isFinite(maximum) && number > maximum) input.max = String(Math.ceil(number / step) * step);
    input.value = String(number);
  }

  function positiveStep(value) {
    const step = Number(value);
    return Number.isFinite(step) && step > 0 ? step : 1;
  }

  function ensureSizeOption(size) {
    const text = String(size);
    let option = Array.from(ui.sizeSelect.options).find((candidate) => candidate.value === text);
    if (!option) {
      option = document.createElement("option");
      option.value = text;
      option.textContent = `${size} x ${size}`;
      ui.sizeSelect.append(option);
      const sorted = Array.from(ui.sizeSelect.options).sort((left, right) => Number(left.value) - Number(right.value));
      ui.sizeSelect.replaceChildren(...sorted);
    }
    ui.sizeSelect.value = text;
  }

  function syncControlLabels() {
    ui.brushValue.textContent = String(brushSize);
    ui.brushPowerValue.textContent = Number(ui.brushPowerSlider.value).toFixed(2);
    ui.radiusValue.textContent = String(simulation.rule.radius);
    ui.alphaValue.textContent = Number(simulation.rule.alpha).toFixed(1);
    ui.muValue.textContent = Number(simulation.rule.mu).toFixed(3);
    ui.sigmaValue.textContent = Number(simulation.rule.sigma).toFixed(3);
    ui.dtValue.textContent = `${Number(simulation.rule.dt).toFixed(3)} (T=${Math.round(1 / simulation.rule.dt)})`;
    ui.gainValue.textContent = Number(simulation.rule.gain).toFixed(2);
    ui.decayValue.textContent = Number(simulation.rule.decay).toFixed(3);
    ui.fpsCapValue.textContent = ui.fpsCapSlider.value;
    ui.stepsValue.textContent = ui.stepsSlider.value;
  }

  function syncControlsFromRule() {
    setRangeValue(ui.radiusSlider, simulation.rule.radius);
    setRangeValue(ui.alphaSlider, simulation.rule.alpha);
    setRangeValue(ui.muSlider, simulation.rule.mu);
    setRangeValue(ui.sigmaSlider, simulation.rule.sigma);
    setRangeValue(ui.dtSlider, simulation.rule.dt);
    setRangeValue(ui.gainSlider, simulation.rule.gain);
    setRangeValue(ui.decaySlider, simulation.rule.decay);
    ensureSizeOption(simulation.size);
    keyboardCursor.x = core.clamp(keyboardCursor.x, 0, simulation.size - 1);
    keyboardCursor.y = core.clamp(keyboardCursor.y, 0, simulation.size - 1);
    syncControlLabels();
  }

  function updateRuleFromControls(rebuildKernel) {
    simulation.updateRule({
      radius: Number(ui.radiusSlider.value),
      alpha: Number(ui.alphaSlider.value),
      mu: Number(ui.muSlider.value),
      sigma: Number(ui.sigmaSlider.value),
      dt: Number(ui.dtSlider.value),
      gain: Number(ui.gainSlider.value),
      decay: Number(ui.decaySlider.value),
    }, rebuildKernel);
    syncControlLabels();
    if (rebuildKernel) requestRender("kernel");
  }

  function applyPreset(id) {
    const preset = presets.find((item) => item.id === id) || presets[0];
    const rule = core.cloneRule({
      ...core.DEFAULT_RULE,
      radius: preset.radius,
      alpha: 4,
      mu: preset.mu,
      sigma: preset.sigma,
      dt: preset.dt,
      ts: Math.round(1 / preset.dt),
      gain: 1,
      decay: 0,
    });
    simulation.resize(preset.size, false);
    simulation.setRule(rule);
    simulation.seed(preset.seed);
    syncControlsFromRule();
    renderer.markAll();
    scheduleFrame();
  }

  function buildLibraryForms() {
    return catalog.buildLibraryForms([{
      id: "legacy",
      title: "Bundled catalogue",
      entries: Array.isArray(window.animalArr) ? window.animalArr : [],
    }]);
  }

  function selectLibraryForm(id) {
    selectedFormId = id;
    const form = formsById.get(id);
    ui.selectedForm.textContent = form
      ? `${form.code || "-"} · ${form.name} · ${form.section || "Unsorted"}`
      : "No species selected";
    highlightAnimalItem(getAnimalItemById(form?.index));
  }

  function loadSelectedForm() {
    const form = formsById.get(selectedFormId);
    if (!form) return;
    const cellData = core.parseCellArray(form.cells);
    const info = core.cloneRule({ ...form.ruleInfo, alpha: 4, gain: 1, decay: 0 });
    const nextSize = chooseWorldSize(cellData, 24, Math.max(64, info.radius * 2 + 1));
    simulation.resize(nextSize, false);
    simulation.setRule(info);
    simulation.placeCells(cellData);
    syncControlsFromRule();
    renderer.markAll();
    scheduleFrame();
  }

  function selectAnimalByIndex(index) {
    const form = formsByIndex.get(index);
    if (!form) return;
    selectLibraryForm(form.id);
    runSafely(`Unable to load ${form.name}.`, loadSelectedForm);
  }

  function selectAnimalCode(code) {
    const source = Array.isArray(window.animalArr) ? window.animalArr : [];
    for (let index = 0; index < source.length; index += 1) {
      const rawCode = source[index]?.[0] || "";
      if (rawCode === code || rawCode.split("(")[0] === code) {
        selectAnimalByIndex(index);
        return;
      }
    }
  }

  function getAnimalItemById(index) {
    return index == null ? null : ui.animalList.querySelector(`[data-animalid="${index}"]`);
  }

  function setGroupOpen(group, isOpen) {
    group.classList.toggle("closed", !isOpen);
    group.firstElementChild?.setAttribute("aria-expanded", String(isOpen));
  }

  function highlightAnimalItem(item) {
    if (selectedAnimalItem) {
      selectedAnimalItem.classList.remove("selected");
      selectedAnimalItem.setAttribute("aria-selected", "false");
    }
    if (!item) {
      selectedAnimalItem = null;
      return;
    }
    item.classList.add("selected");
    item.setAttribute("aria-selected", "true");
    let node = item.parentElement;
    while (node) {
      if (node.classList?.contains("group")) setGroupOpen(node, true);
      node = node.parentElement;
    }
    ui.animalWindow.scrollTop = Math.max(0, item.offsetTop - ui.animalWindow.clientHeight / 2);
    selectedAnimalItem = item;
  }

  function openAllGroups(isOpen, prefix) {
    for (const group of ui.animalList.querySelectorAll(".group")) {
      const text = group.firstElementChild?.textContent || "";
      if (prefix == null || text.startsWith(prefix)) setGroupOpen(group, isOpen);
    }
  }

  function defaultGroups() {
    openAllGroups(false);
    openAllGroups(true, "class:");
    openAllGroups(true, "order:");
    openAllGroups(true, "subfamily:");
  }

  function bindKeyboardActivation(element, action) {
    element.addEventListener("click", action);
    element.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      action();
    });
  }

  function populateCatalogue() {
    ui.catalogue.replaceChildren();
    const source = Array.isArray(window.catalogueArr) ? window.catalogueArr : [];
    for (const row of source) {
      const tableRow = document.createElement("tr");
      for (const entry of row) {
        const [src, code, english, chinese] = entry;
        const cell = document.createElement("td");
        const image = document.createElement("img");
        image.src = `assets/${src}`;
        image.alt = english;
        image.title = `${english} ${chinese}`.trim();
        image.className = "cat-img";
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-label", `Browse ${english}`);
        bindKeyboardActivation(image, () => {
          defaultGroups();
          selectAnimalCode(code);
        });
        cell.append(image);
        tableRow.append(cell);
      }
      ui.catalogue.append(tableRow);
    }
  }

  function textSpan(className, text) {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = text;
    return span;
  }

  function populateAnimalList() {
    const source = Array.isArray(window.animalArr) ? window.animalArr : [];
    ui.animalList.replaceChildren();
    ui.animalList.setAttribute("role", "tree");
    const containers = [ui.animalList];
    let currentContainer = ui.animalList;
    let lastCode = "";
    let lastEnglishRoot = "";
    let lastChineseRoot = "";

    for (let index = 0; index < source.length; index += 1) {
      const item = source[index];
      if (!Array.isArray(item) || item.length < 3) continue;
      let codeText = core.displayCode(String(item[0]).split("(")[0]);
      const englishParts = String(item[1] || "").split(" ");
      const chineseParts = String(item[2] || "").split("(");
      const sameCode = codeText !== "" && codeText === lastCode;
      const sameEnglishRoot = englishParts[0] !== "" && englishParts[0] === lastEnglishRoot;
      const sameChineseRoot = chineseParts[0] !== "" && chineseParts[0] === lastChineseRoot;
      lastCode = codeText;
      lastEnglishRoot = englishParts[0];
      lastChineseRoot = chineseParts[0];

      if (item.length >= 4) {
        const form = formsByIndex.get(index);
        const listItem = document.createElement("li");
        listItem.className = "action";
        listItem.dataset.animalid = String(index);
        listItem.tabIndex = 0;
        listItem.setAttribute("role", "treeitem");
        listItem.setAttribute("aria-selected", "false");
        listItem.title = `${item[0]} ${item[1]} ${item[2]}\n${form?.rule || ""}`;
        if (sameCode) codeText = "-".repeat(codeText.length);
        if (sameEnglishRoot) englishParts[0] = `${lastEnglishRoot.substring(0, 1)}.`;
        if (sameChineseRoot) chineseParts[0] = "~";
        listItem.append(
          textSpan("animal-code", codeText),
          textSpan("animal-name", englishParts.join(" ")),
          textSpan("animal-layer", `[${(form?.ruleInfo.layer || 0) + 1}]`),
        );
        bindKeyboardActivation(listItem, () => selectAnimalByIndex(index));
        currentContainer.append(listItem);
        continue;
      }

      const level = Number.parseInt(codeText.substring(1), 10) || 1;
      const parentContainer = containers[Math.min(level - 1, containers.length - 1)] || ui.animalList;
      const group = document.createElement("li");
      group.className = "group";
      const heading = document.createElement("div");
      const childList = document.createElement("ul");
      heading.title = `${englishParts.join(" ")} ${chineseParts.join("(")}`.trim();
      heading.textContent = `${englishParts.join(" ")} ${chineseParts[0].split(" ")[0]}`.trim();
      heading.tabIndex = 0;
      heading.setAttribute("role", "treeitem");
      heading.setAttribute("aria-expanded", "true");
      childList.setAttribute("role", "group");
      bindKeyboardActivation(heading, () => setGroupOpen(group, group.classList.contains("closed")));
      group.append(heading, childList);
      parentContainer.append(group);
      containers[level] = childList;
      containers.length = level + 1;
      currentContainer = childList;
    }
    defaultGroups();
  }

  function canvasPoint(event) {
    const rect = fieldCanvas.getBoundingClientRect();
    return {
      x: Math.floor(((event.clientX - rect.left) / rect.width) * simulation.size),
      y: Math.floor(((event.clientY - rect.top) / rect.height) * simulation.size),
    };
  }

  function queuePaintPoint(point) {
    if (!lastPaintPoint) {
      pendingPaintPoints.push(point);
      lastPaintPoint = point;
      return;
    }
    const deltaX = point.x - lastPaintPoint.x;
    const deltaY = point.y - lastPaintPoint.y;
    const steps = Math.max(1, Math.abs(deltaX), Math.abs(deltaY));
    for (let step = 1; step <= steps; step += 1) {
      pendingPaintPoints.push({
        x: Math.round(lastPaintPoint.x + (deltaX * step) / steps),
        y: Math.round(lastPaintPoint.y + (deltaY * step) / steps),
      });
    }
    lastPaintPoint = point;
  }

  function queuePointerEvent(event) {
    const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
    for (const nextEvent of events.length ? events : [event]) queuePaintPoint(canvasPoint(nextEvent));
    scheduleFrame();
  }

  function configureAccessibility() {
    ui.stateLabel.parentElement?.removeAttribute("aria-live");
    ui.stateLabel.setAttribute("role", "status");
    ui.stateLabel.setAttribute("aria-live", "polite");
    fieldCanvas.tabIndex = 0;
    fieldCanvas.setAttribute("role", "application");
    fieldCanvas.setAttribute(
      "aria-label",
      "Editable Lenia simulation field. Use arrow keys to move the cursor and Enter to apply the selected tool.",
    );
    fieldCanvas.style.touchAction = "none";
  }

  function bindEvents() {
    ui.runBtn.addEventListener("click", () => setRunning(!isRunning));
    ui.stepBtn.addEventListener("click", () => runSafely("Unable to step the simulation.", () => {
      simulation.step();
      requestRender("field", "growth", "trace", "metrics");
    }));
    ui.resetBtn.addEventListener("click", () => runSafely("Unable to reset the preset.", () => applyPreset(ui.presetSelect.value)));
    ui.clearBtn.addEventListener("click", () => {
      simulation.clear();
      requestRender("field", "growth", "trace", "metrics");
    });
    ui.randomBtn.addEventListener("click", () => {
      simulation.randomize();
      requestRender("field", "growth", "trace", "metrics");
    });
    ui.presetSelect.addEventListener("change", () => runSafely("Unable to apply the preset.", () => applyPreset(ui.presetSelect.value)));
    ui.paintBtn.addEventListener("click", () => setBrushMode("paint"));
    ui.eraseBtn.addEventListener("click", () => setBrushMode("erase"));
    ui.sampleBtn.addEventListener("click", () => setBrushMode("sample"));

    ui.brushSlider.addEventListener("input", () => {
      brushSize = Number(ui.brushSlider.value);
      syncControlLabels();
    });
    ui.brushPowerSlider.addEventListener("input", syncControlLabels);
    ui.sizeSelect.addEventListener("change", () => runSafely("Unable to resize the world.", () => {
      simulation.resize(Number(ui.sizeSelect.value), true);
      syncControlsFromRule();
      renderer.markAll();
      scheduleFrame();
    }));

    const ruleSliders = [ui.radiusSlider, ui.alphaSlider, ui.muSlider, ui.sigmaSlider, ui.dtSlider, ui.gainSlider, ui.decaySlider];
    for (const slider of ruleSliders) {
      slider.addEventListener("input", () => runSafely("Unable to update the rule.", () => {
        updateRuleFromControls(slider === ui.radiusSlider || slider === ui.alphaSlider);
      }));
    }
    ui.fpsCapSlider.addEventListener("input", syncControlLabels);
    ui.stepsSlider.addEventListener("input", syncControlLabels);
    ui.paletteSelect.addEventListener("change", () => {
      renderer.setPalette(ui.paletteSelect.value);
      scheduleFrame();
    });

    let pointerDown = false;
    fieldCanvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      pointerDown = true;
      lastPaintPoint = null;
      fieldCanvas.setPointerCapture(event.pointerId);
      queuePointerEvent(event);
    }, { passive: false });
    fieldCanvas.addEventListener("pointermove", (event) => {
      if (!pointerDown) return;
      event.preventDefault();
      queuePointerEvent(event);
    }, { passive: false });
    fieldCanvas.addEventListener("pointerup", (event) => {
      if (pointerDown) queuePointerEvent(event);
      pointerDown = false;
      lastPaintPoint = null;
      if (fieldCanvas.hasPointerCapture(event.pointerId)) fieldCanvas.releasePointerCapture(event.pointerId);
    });
    fieldCanvas.addEventListener("pointercancel", () => {
      pointerDown = false;
      lastPaintPoint = null;
    });
    fieldCanvas.addEventListener("lostpointercapture", () => {
      pointerDown = false;
      lastPaintPoint = null;
    });
    fieldCanvas.addEventListener("focus", () => requestRender("field"));
    fieldCanvas.addEventListener("blur", () => requestRender("field"));
    fieldCanvas.addEventListener("keydown", (event) => {
      const directions = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (directions[event.key]) {
        event.preventDefault();
        const distance = event.shiftKey ? Math.max(1, brushSize) : 1;
        keyboardCursor.x = core.modulo(keyboardCursor.x + directions[event.key][0] * distance, simulation.size);
        keyboardCursor.y = core.modulo(keyboardCursor.y + directions[event.key][1] * distance, simulation.size);
        ui.sampleLabel.textContent = simulation.field[simulation.indexOf(keyboardCursor.x, keyboardCursor.y)].toFixed(3);
        requestRender("field");
      } else if (event.key === "Enter") {
        event.preventDefault();
        pendingPaintPoints.push({ ...keyboardCursor });
        scheduleFrame();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.target instanceof Element && event.target.matches("input, select, button, [role=button], [role=treeitem]")) return;
      if (event.key === " ") {
        event.preventDefault();
        setRunning(!isRunning);
      } else if (event.key.toLowerCase() === "r") {
        runSafely("Unable to reset the preset.", () => applyPreset(ui.presetSelect.value));
      } else if (event.key.toLowerCase() === "n") {
        simulation.randomize();
        requestRender("field", "growth", "trace", "metrics");
      }
    });
  }

  function boot() {
    configureAccessibility();
    libraryForms = buildLibraryForms();
    formsById = new Map(libraryForms.map((form) => [form.id, form]));
    formsByIndex = new Map(libraryForms.map((form) => [form.index, form]));
    for (const preset of presets) {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      ui.presetSelect.append(option);
    }
    bindEvents();
    populateCatalogue();
    populateAnimalList();
    ui.libraryCount.textContent = `${libraryForms.length} species`;
    const defaultForm = libraryForms.find((form) => form.rawCode === "O2(a)") || libraryForms[0];
    if (defaultForm) {
      selectLibraryForm(defaultForm.id);
      runSafely(`Unable to load ${defaultForm.name}.`, loadSelectedForm);
    } else {
      applyPreset("orbium");
    }
    setBrushMode("paint");
    setRunning(false);
    renderer.markAll();
    scheduleFrame();
  }

  runSafely("Leniency failed to start.", boot);
})();
