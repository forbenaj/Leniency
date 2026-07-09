const fieldCanvas = document.querySelector("#fieldCanvas");
const growthCanvas = document.querySelector("#growthCanvas");
const kernelCanvas = document.querySelector("#kernelCanvas");
const traceCanvas = document.querySelector("#traceCanvas");

const fieldCtx = fieldCanvas.getContext("2d");
const growthCtx = growthCanvas.getContext("2d");
const kernelCtx = kernelCanvas.getContext("2d");
const traceCtx = traceCanvas.getContext("2d");

const ui = {
  libraryCount: document.querySelector("#libraryCount"),
  catalogue: document.querySelector("#Catalogue"),
  animalList: document.querySelector("#AnimalList"),
  animalWindow: document.querySelector("#AnimalWindow"),
  selectedForm: document.querySelector("#selectedForm"),
  runBtn: document.querySelector("#runBtn"),
  stepBtn: document.querySelector("#stepBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  randomBtn: document.querySelector("#randomBtn"),
  presetSelect: document.querySelector("#presetSelect"),
  paintBtn: document.querySelector("#paintBtn"),
  eraseBtn: document.querySelector("#eraseBtn"),
  sampleBtn: document.querySelector("#sampleBtn"),
  brushSlider: document.querySelector("#brushSlider"),
  brushValue: document.querySelector("#brushValue"),
  brushPowerSlider: document.querySelector("#brushPowerSlider"),
  brushPowerValue: document.querySelector("#brushPowerValue"),
  sizeSelect: document.querySelector("#sizeSelect"),
  radiusSlider: document.querySelector("#radiusSlider"),
  radiusValue: document.querySelector("#radiusValue"),
  alphaSlider: document.querySelector("#alphaSlider"),
  alphaValue: document.querySelector("#alphaValue"),
  muSlider: document.querySelector("#muSlider"),
  muValue: document.querySelector("#muValue"),
  sigmaSlider: document.querySelector("#sigmaSlider"),
  sigmaValue: document.querySelector("#sigmaValue"),
  dtSlider: document.querySelector("#dtSlider"),
  dtValue: document.querySelector("#dtValue"),
  gainSlider: document.querySelector("#gainSlider"),
  gainValue: document.querySelector("#gainValue"),
  decaySlider: document.querySelector("#decaySlider"),
  decayValue: document.querySelector("#decayValue"),
  fpsCapSlider: document.querySelector("#fpsCapSlider"),
  fpsCapValue: document.querySelector("#fpsCapValue"),
  stepsSlider: document.querySelector("#stepsSlider"),
  stepsValue: document.querySelector("#stepsValue"),
  paletteSelect: document.querySelector("#paletteSelect"),
  stateLabel: document.querySelector("#stateLabel"),
  fpsLabel: document.querySelector("#fpsLabel"),
  timeLabel: document.querySelector("#timeLabel"),
  massLabel: document.querySelector("#massLabel"),
  growthLabel: document.querySelector("#growthLabel"),
  energyLabel: document.querySelector("#energyLabel"),
  sampleLabel: document.querySelector("#sampleLabel"),
};

const presets = [
  {
    id: "orbium",
    name: "Orbium seed",
    size: 64,
    radius: 10,
    mu: 0.07,
    sigma: 0.035,
    dt: 0.025,
    seed: "orbium",
  },
  {
    id: "drifter",
    name: "Drifter ring",
    size: 64,
    radius: 9,
    mu: 0.09,
    sigma: 0.04,
    dt: 0.03,
    seed: "ring",
  },
  {
    id: "nebula",
    name: "Soft nebula",
    size: 128,
    radius: 18,
    mu: 0.11,
    sigma: 0.055,
    dt: 0.025,
    seed: "nebula",
  },
  {
    id: "smooth",
    name: "SmoothLife-ish",
    size: 64,
    radius: 8,
    mu: 0.31,
    sigma: 0.049,
    dt: 0.06,
    seed: "speckles",
  },
];

const palettes = {
  aurora: [
    [5, 7, 9],
    [17, 40, 42],
    [54, 130, 124],
    [149, 214, 107],
    [240, 193, 90],
    [236, 115, 94],
    [164, 140, 240],
  ],
  ember: [
    [7, 7, 8],
    [39, 23, 21],
    [103, 45, 35],
    [183, 79, 53],
    [239, 155, 74],
    [244, 214, 124],
    [242, 239, 205],
  ],
  mono: [
    [4, 5, 5],
    [22, 27, 27],
    [48, 59, 58],
    [85, 104, 101],
    [137, 158, 151],
    [196, 210, 202],
    [244, 246, 241],
  ],
};

const ZIP_HEADER = "(zip)";
const ZIP2_HEADER = "(zip2)";
const ZIP_START = 192;
const DEFAULT_RULE = {
  radius: 10,
  ts: 10,
  dt: 0.1,
  limitValue: true,
  deltaName: "gaus",
  mu: 0.15,
  sigma: 0.015,
  coreName: "bump4",
  layer: 0,
  beta: [1, 0, 0, 0],
  eta: [0, 0, 0, 0],
};

let size = 96;
let field = new Float32Array(size * size);
let next = new Float32Array(size * size);
let growth = new Float32Array(size * size);
let kernelOffsets = [];
let isRunning = false;
let brushMode = "paint";
let brushSize = 7;
let selectedFormId = null;
let libraryForms = [];
let selectedAnimalItem = null;
let currentRule = { ...DEFAULT_RULE };
let simTime = 0;
let frameCount = 0;
let fpsClock = performance.now();
let lastFrame = performance.now();
let lastStepAt = performance.now();
let metrics = { mass: 0, growth: 0, energy: 0 };
let massTrace = [];

function clamp(value, low = 0, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function fromZip(char) {
  if (char === "0") return 0;
  if (char === "1") return 100;
  return char.charCodeAt(0) - (ZIP_START - 1);
}

function isZipRepeat(value) {
  return value.length > 0 && value.charCodeAt(0) >= ZIP_START;
}

function fromRepeat(value) {
  if (value === "") return 1;
  if (!isZipRepeat(value)) return Number.parseInt(value, 10) || 0;
  if (value.length === 1) return fromZip(value);
  return fromZip(value[0]) * 100 + fromZip(value[1]);
}

function parseCellArray(cellText) {
  let source = cellText || "";
  const isZip1 = source.startsWith(ZIP_HEADER);
  const isZip2 = source.startsWith(ZIP2_HEADER);
  const isZip = isZip1 || isZip2;
  if (isZip1) source = source.slice(ZIP_HEADER.length);
  if (isZip2) source = source.slice(ZIP2_HEADER.length);

  let rows = source.split("/").map((rowText) => {
    let row = rowText.trim();
    if (isZip) {
      row = row
        .split("-")
        .map((part) => {
          const bits = part.split(".");
          return bits.length === 1 ? part : "0".repeat(fromRepeat(bits[0])) + bits[1];
        })
        .join("");
      return [...row].map((char) => clamp(fromZip(char) / 100));
    }
    return row === "" ? [] : row.split(",").map((value) => clamp(Number.parseFloat(value) || 0));
  });

  if (isZip2) {
    const doubled = [];
    for (const row of rows) {
      const wide = row.flatMap((value) => [value, value]);
      doubled.push([...wide], [...wide]);
    }
    rows = doubled;
  }

  return {
    rows,
    width: rows.reduce((max, row) => Math.max(max, row.length), 0),
    height: rows.length,
  };
}

function parseFraction(value) {
  if (value == null || value === "") return 0;
  const text = String(value).trim();
  if (text.includes("/")) {
    const [top, bottom] = text.split("/").map(Number);
    return bottom ? top / bottom : 0;
  }
  return Number.parseFloat(text) || 0;
}

function parseRule(ruleText) {
  const rule = { ...DEFAULT_RULE, beta: [...DEFAULT_RULE.beta], eta: [...DEFAULT_RULE.eta] };
  const radius = Number.parseInt(ruleText.match(/(?:^|;)R=(\d+)/)?.[1] || "", 10);
  if (Number.isFinite(radius)) rule.radius = radius;

  const delta = ruleText.match(/d=([a-z0-9/]+)\(([-\d.]+),([-\d.]+)\)\*([-\d.]+)(\+?)/i);
  if (delta) {
    rule.deltaName = delta[1];
    rule.mu = Number.parseFloat(delta[2]);
    rule.sigma = Number.parseFloat(delta[3]);
    const multiplier = Math.abs(Number.parseFloat(delta[4]));
    rule.ts = multiplier > 0 ? Math.round(1 / multiplier) : DEFAULT_RULE.ts;
    rule.dt = multiplier || DEFAULT_RULE.dt;
    rule.limitValue = delta[5] !== "+";
  }

  const kernel = ruleText.match(/k=([^;]+)/i);
  if (kernel) {
    const text = kernel[1];
    const name = text.split("(")[0];
    const legacyName = name === "bimo4" ? "quad4" : name === "bist4" ? "stpz1/4" : name === "trmo4" ? "quad4" : name;
    const args = [...text.matchAll(/\(([^)]*)\)/g)].map((match) =>
      match[1] === "" ? [] : match[1].split(",").map(parseFraction),
    );
    rule.coreName = legacyName.replace(/\d+$/, "") === "bump" ? "bump4" : legacyName;
    if (!["bump4", "quad4", "trap1/5", "stpz1/4", "life"].includes(rule.coreName)) {
      rule.coreName = legacyName.startsWith("quad") ? "quad4" : legacyName.startsWith("bump") ? "bump4" : legacyName;
    }
    const beta = args[0] || [];
    const eta = args[1] || [];
    rule.layer = Math.max(beta.length - 1, 0);
    if (name === "trmo4") rule.layer = 2;
    for (let i = 0; i < 4; i += 1) {
      rule.beta[i] = beta[i] || 0;
      rule.eta[i] = eta[i] || 0;
    }
    if (rule.layer <= 1 && rule.beta[0] === 0) rule.beta[0] = 1;
  }

  return rule;
}

function splitLifeformPayload(payload) {
  const parts = payload.split(";cells=");
  return {
    rule: parts[0] || "",
    cells: parts[1] || payload,
  };
}

function buildLibraryForms() {
  const source = Array.isArray(window.animalArr) ? window.animalArr : [];
  const forms = [];
  const groupStack = [];
  for (let i = 0; i < source.length; i += 1) {
    const item = source[i];
    if (!Array.isArray(item)) continue;
    if (item.length === 3 && item[1]) {
      const level = Number.parseInt(String(item[0]).replace(/^\D+/, ""), 10) || 1;
      groupStack[level - 1] = item[1];
      groupStack.length = level;
      continue;
    }
    if (item.length < 4 || !item[3]) continue;
    const { rule, cells } = splitLifeformPayload(item[3]);
    const rawCode = item[0] || `form-${i}`;
    const code = rawCode.replace(/^[~*]/, "");
    const name = item[1] || code;
    const groups = groupStack.filter(Boolean);
    const section = groups[groups.length - 1]?.replace(/^(class|order|family|subfamily):\s*/i, "") || "";
    forms.push({
      id: `${i}-${code}-${name}`,
      index: i,
      code,
      rawCode,
      name,
      section,
      groups,
      chineseName: item[2] || "",
      rule,
      cells,
      ruleInfo: parseRule(rule),
    });
  }
  return forms;
}

function indexOf(x, y) {
  return ((y + size) % size) * size + ((x + size) % size);
}

function bump(x, alpha = 4) {
  if (x <= 0 || x >= 1) return 0;
  const k = 4 * x * (1 - x);
  return Math.exp(alpha * (1 - 1 / k));
}

function coreValue(r, rule = currentRule) {
  const alpha = Number(ui.alphaSlider.value);
  if (r < 0 || r > 1) return 0;
  const k = 4 * r * (1 - r);
  switch (rule.coreName) {
    case "quad4":
      return k <= 0 ? 0 : Math.pow(k, alpha);
    case "trap1/5": {
      const q = 1 / 5;
      if (r < q || r > 1 - q) return 0;
      if (r < 2 * q) return (r - q) / q;
      if (r > 1 - 2 * q) return (1 - q - r) / q;
      return 1;
    }
    case "stpz1/4": {
      const q = 1 / 4;
      return r >= q && r <= 1 - q ? 1 : 0;
    }
    case "life": {
      const q = 1 / 4;
      if (r < q) return 0.5;
      return r > 1 - q ? 0 : 1;
    }
    case "bump4":
    default:
      return bump(r, alpha);
  }
}

function kernelValue(r, rule = currentRule) {
  const distance = Math.abs(r);
  if (rule.layer === 0) return coreValue(distance, rule);
  if (distance >= 1) return 0;
  const layers = rule.layer + 1;
  const scaled = distance * layers;
  const betaIndex = Math.floor(scaled);
  const etaIndex = Math.floor(scaled + 0.5);
  const eta = etaIndex <= rule.layer ? rule.eta[etaIndex] : 0;
  return coreValue(scaled % 1, rule) * ((rule.beta[betaIndex] || 0) - eta) + eta;
}

function growthCurve(n) {
  const mu = Number(ui.muSlider.value);
  const sigma = Number(ui.sigmaSlider.value);
  const distance = Math.abs(n - mu);
  const squared = distance * distance;
  switch (currentRule.deltaName) {
    case "quad4": {
      const reach = 9 * sigma * sigma;
      return squared > reach ? -1 : Math.pow(1 - squared / reach, Number(ui.alphaSlider.value)) * 2 - 1;
    }
    case "trap": {
      const p = sigma / 2;
      const q = sigma * 2;
      if (distance <= p) return 1;
      return distance <= q ? (2 * (q - distance)) / (q - p) - 1 : -1;
    }
    case "stpz":
      return distance <= sigma ? 1 : -1;
    case "gaus":
    default:
      return 2 * Math.exp(-squared / (2 * sigma * sigma)) - 1;
  }
}

function rebuildKernel() {
  const radius = Number(ui.radiusSlider.value);
  const offsets = [];
  let total = 0;

  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      const distance = Math.hypot(ox, oy);
      if (distance > radius) continue;
      const weight = kernelValue(distance / radius);
      if (weight <= 0) continue;
      offsets.push({ ox, oy, weight });
      total += weight;
    }
  }

  kernelOffsets = offsets.map((item) => ({
    ox: item.ox,
    oy: item.oy,
    weight: item.weight / total,
  }));

  renderKernel();
}

function resizeWorld(newSize) {
  const oldSize = size;
  const oldField = field;
  size = newSize;
  field = new Float32Array(size * size);
  next = new Float32Array(size * size);
  growth = new Float32Array(size * size);

  const copySize = Math.min(oldSize, size);
  const oldOffset = Math.floor((oldSize - copySize) / 2);
  const newOffset = Math.floor((size - copySize) / 2);
  for (let y = 0; y < copySize; y += 1) {
    for (let x = 0; x < copySize; x += 1) {
      field[(y + newOffset) * size + x + newOffset] =
        oldField[(y + oldOffset) * oldSize + x + oldOffset];
    }
  }
}

function clearField() {
  field.fill(0);
  growth.fill(0);
  metrics = { mass: 0, growth: 0, energy: 0 };
  simTime = 0;
  massTrace = [];
  renderAll();
}

function measureField() {
  let mass = 0;
  let energy = 0;
  for (let i = 0; i < field.length; i += 1) {
    mass += field[i];
    energy += field[i] * field[i];
  }
  metrics = {
    mass: mass / field.length,
    growth: 0,
    energy: energy / field.length,
  };
}

function addBlob(cx, cy, radius, amount = 1, softness = 0.9) {
  const reach = Math.ceil(radius * 2);
  for (let y = -reach; y <= reach; y += 1) {
    for (let x = -reach; x <= reach; x += 1) {
      const d = Math.hypot(x, y) / radius;
      if (d > 2) continue;
      const value = amount * Math.exp(-(d * d) / softness);
      const i = indexOf(Math.round(cx + x), Math.round(cy + y));
      field[i] = clamp(field[i] + value);
    }
  }
}

function seedWorld(kind) {
  clearField();
  const c = size / 2;

  if (kind === "orbium") {
    addBlob(c - 8, c - 4, 8.5, 0.95);
    addBlob(c + 3, c - 7, 6.8, 0.82);
    addBlob(c + 10, c + 4, 7.6, 0.7);
    addBlob(c - 4, c + 8, 6.2, 0.58);
  } else if (kind === "ring") {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      addBlob(c + Math.cos(a) * 12, c + Math.sin(a) * 12, 4, 0.48);
    }
    addBlob(c + 4, c - 2, 5, 0.32);
  } else if (kind === "nebula") {
    for (let i = 0; i < 50; i += 1) {
      addBlob(
        c + (Math.random() - 0.5) * size * 0.48,
        c + (Math.random() - 0.5) * size * 0.48,
        2 + Math.random() * 7,
        0.08 + Math.random() * 0.2,
        0.9,
      );
    }
  } else if (kind === "speckles") {
    for (let i = 0; i < field.length; i += 1) {
      field[i] = Math.random() > 0.88 ? Math.random() * 0.8 : 0;
    }
  }

  measureField();
  renderAll();
}

function randomizeField() {
  for (let i = 0; i < field.length; i += 1) {
    field[i] = Math.random() > 0.78 ? Math.random() : 0;
  }
  simTime = 0;
  massTrace = [];
  measureField();
  renderAll();
}

function stepSimulation() {
  const dt = Number(ui.dtSlider.value);
  const gain = Number(ui.gainSlider.value);
  const decay = Number(ui.decaySlider.value);
  let mass = 0;
  let growthSum = 0;
  let energy = 0;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let neighborhood = 0;
      for (let k = 0; k < kernelOffsets.length; k += 1) {
        const item = kernelOffsets[k];
        neighborhood += field[indexOf(x + item.ox, y + item.oy)] * item.weight;
      }
      const i = y * size + x;
      const g = growthCurve(neighborhood) * gain;
      growth[i] = g;
      const rawValue = field[i] + dt * g - decay * field[i];
      const value = currentRule.limitValue ? clamp(rawValue) : Math.max(0, rawValue);
      next[i] = value;
      mass += value;
      growthSum += g;
      energy += Math.abs(g) * value;
    }
  }

  [field, next] = [next, field];
  simTime += dt;
  metrics = {
    mass: mass / field.length,
    growth: growthSum / field.length,
    energy: energy / field.length,
  };
  massTrace.push(metrics.mass);
  if (massTrace.length > 180) massTrace.shift();
}

function colorRamp(value) {
  const palette = palettes[ui.paletteSelect.value] || palettes.aurora;
  const scaled = clamp(value) * (palette.length - 1);
  const base = Math.floor(scaled);
  const t = scaled - base;
  const a = palette[base];
  const b = palette[Math.min(base + 1, palette.length - 1)];
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function renderArray(ctx, canvas, data, mapValue = (v) => v) {
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < data.length; i += 1) {
    const value = mapValue(data[i]);
    const [r, g, b] = colorRamp(value);
    const p = i * 4;
    image.data[p] = r;
    image.data[p + 1] = g;
    image.data[p + 2] = b;
    image.data[p + 3] = 255;
  }
  const buffer = document.createElement("canvas");
  buffer.width = size;
  buffer.height = size;
  buffer.getContext("2d").putImageData(image, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
}

function renderKernel() {
  const image = kernelCtx.createImageData(size, size);
  const center = Math.floor(size / 2);
  const scratch = new Float32Array(size * size);
  let max = 0;

  for (const item of kernelOffsets) {
    const x = center + item.ox;
    const y = center + item.oy;
    if (x < 0 || x >= size || y < 0 || y >= size) continue;
    scratch[y * size + x] = item.weight;
    max = Math.max(max, item.weight);
  }

  for (let i = 0; i < scratch.length; i += 1) {
    const [r, g, b] = colorRamp(max > 0 ? scratch[i] / max : 0);
    const p = i * 4;
    image.data[p] = r;
    image.data[p + 1] = g;
    image.data[p + 2] = b;
    image.data[p + 3] = 255;
  }

  const buffer = document.createElement("canvas");
  buffer.width = size;
  buffer.height = size;
  buffer.getContext("2d").putImageData(image, 0, 0);
  kernelCtx.imageSmoothingEnabled = false;
  kernelCtx.clearRect(0, 0, kernelCanvas.width, kernelCanvas.height);
  kernelCtx.drawImage(buffer, 0, 0, kernelCanvas.width, kernelCanvas.height);
}

function renderTrace() {
  const width = traceCanvas.width;
  const height = traceCanvas.height;
  traceCtx.clearRect(0, 0, width, height);
  traceCtx.fillStyle = "#060808";
  traceCtx.fillRect(0, 0, width, height);
  traceCtx.strokeStyle = "#35413a";
  traceCtx.lineWidth = 1;
  for (let y = 0; y <= 4; y += 1) {
    const py = (height / 4) * y;
    traceCtx.beginPath();
    traceCtx.moveTo(0, py);
    traceCtx.lineTo(width, py);
    traceCtx.stroke();
  }

  if (massTrace.length < 2) return;

  traceCtx.strokeStyle = "#f0c15a";
  traceCtx.lineWidth = 3;
  traceCtx.beginPath();
  massTrace.forEach((value, i) => {
    const x = (i / Math.max(1, massTrace.length - 1)) * width;
    const y = height - clamp(value, 0, 0.35) * (height / 0.35);
    if (i === 0) traceCtx.moveTo(x, y);
    else traceCtx.lineTo(x, y);
  });
  traceCtx.stroke();
}

function renderMetrics() {
  ui.massLabel.textContent = metrics.mass.toFixed(3);
  ui.growthLabel.textContent = metrics.growth.toFixed(3);
  ui.energyLabel.textContent = metrics.energy.toFixed(3);
  ui.timeLabel.textContent = simTime.toFixed(1);
}

function renderAll() {
  renderArray(fieldCtx, fieldCanvas, field);
  renderArray(growthCtx, growthCanvas, growth, (value) => value * 0.5 + 0.5);
  renderKernel();
  renderTrace();
  renderMetrics();
}

function tick(now) {
  const targetMs = 1000 / Number(ui.fpsCapSlider.value);
  if (now - lastStepAt < targetMs) {
    requestAnimationFrame(tick);
    return;
  }
  lastStepAt = now;

  if (isRunning) {
    const steps = Number(ui.stepsSlider.value);
    for (let i = 0; i < steps; i += 1) stepSimulation();
  }

  frameCount += 1;
  if (now - fpsClock > 500) {
    ui.fpsLabel.textContent = Math.round((frameCount * 1000) / (now - fpsClock));
    frameCount = 0;
    fpsClock = now;
  }

  renderAll();
  lastFrame = now;
  requestAnimationFrame(tick);
}

function setRunning(value) {
  isRunning = value;
  ui.runBtn.textContent = isRunning ? "Ⅱ" : "▶";
  ui.stateLabel.textContent = isRunning ? "Running" : "Paused";
}

function syncControlLabels() {
  ui.brushValue.textContent = brushSize;
  ui.brushPowerValue.textContent = Number(ui.brushPowerSlider.value).toFixed(2);
  ui.radiusValue.textContent = ui.radiusSlider.value;
  ui.alphaValue.textContent = Number(ui.alphaSlider.value).toFixed(1);
  ui.muValue.textContent = Number(ui.muSlider.value).toFixed(3);
  ui.sigmaValue.textContent = Number(ui.sigmaSlider.value).toFixed(3);
  ui.dtValue.textContent = `${Number(ui.dtSlider.value).toFixed(3)} (T=${Math.round(1 / Number(ui.dtSlider.value))})`;
  ui.gainValue.textContent = Number(ui.gainSlider.value).toFixed(2);
  ui.decayValue.textContent = Number(ui.decaySlider.value).toFixed(3);
  ui.fpsCapValue.textContent = ui.fpsCapSlider.value;
  ui.stepsValue.textContent = ui.stepsSlider.value;
}

function applyPreset(id) {
  const preset = presets.find((item) => item.id === id) ?? presets[0];
  currentRule = { ...DEFAULT_RULE, beta: [...DEFAULT_RULE.beta], eta: [...DEFAULT_RULE.eta] };
  ui.sizeSelect.value = String(preset.size);
  ui.radiusSlider.value = String(preset.radius);
  ui.muSlider.value = String(preset.mu);
  ui.sigmaSlider.value = String(preset.sigma);
  ui.dtSlider.value = String(preset.dt);
  ui.alphaSlider.value = "4";
  ui.gainSlider.value = "1";
  ui.decaySlider.value = "0";
  resizeWorld(preset.size);
  syncControlLabels();
  rebuildKernel();
  seedWorld(preset.seed);
}

function chooseWorldSize(cellData) {
  const needed = Math.max(cellData.width, cellData.height) + 24;
  if (needed <= 64) return 64;
  if (needed <= 96) return 96;
  return 128;
}

function setSliderValue(slider, value) {
  if (value == null || Number.isNaN(value)) return;
  const min = Number(slider.min);
  const max = Number(slider.max);
  slider.value = String(clamp(value, min, max));
}

function layerLabel(ruleText) {
  return `[${parseRule(ruleText).layer + 1}]`;
}

function displayCode(rawCode) {
  return String(rawCode || "").replace(/^[~*]/, "");
}

function placeCells(cellData) {
  clearField();
  const scale = Math.min(1, (size * 0.86) / Math.max(1, cellData.width, cellData.height));
  const outW = Math.max(1, Math.round(cellData.width * scale));
  const outH = Math.max(1, Math.round(cellData.height * scale));
  const startX = Math.floor(size / 2 - outW / 2);
  const startY = Math.floor(size / 2 - outH / 2);

  for (let y = 0; y < outH; y += 1) {
    for (let x = 0; x < outW; x += 1) {
      const sourceY = Math.min(cellData.height - 1, Math.floor(y / scale));
      const sourceX = Math.min(cellData.width - 1, Math.floor(x / scale));
      const value = cellData.rows[sourceY]?.[sourceX] || 0;
      if (value > 0) field[indexOf(startX + x, startY + y)] = value;
    }
  }

  measureField();
  renderAll();
}

function selectLibraryForm(id) {
  selectedFormId = id;
  const form = libraryForms.find((item) => item.id === id);
  ui.selectedForm.textContent = form
    ? `${form.code || "-"} · ${form.name} · ${form.section || "Unsorted"}`
    : "No species selected";
  highlightAnimalItem(getAnimalItemById(form?.index));
}

function loadSelectedForm() {
  const form = libraryForms.find((item) => item.id === selectedFormId);
  if (!form) return;

  const cellData = parseCellArray(form.cells);
  const nextSize = chooseWorldSize(cellData);
  ui.sizeSelect.value = String(nextSize);
  resizeWorld(nextSize);

  const info = form.ruleInfo;
  currentRule = { ...info, beta: [...info.beta], eta: [...info.eta] };
  setSliderValue(ui.radiusSlider, info.radius);
  setSliderValue(ui.muSlider, info.mu);
  setSliderValue(ui.sigmaSlider, info.sigma);
  setSliderValue(ui.dtSlider, info.dt);
  ui.gainSlider.value = "1";
  ui.decaySlider.value = "0";
  syncControlLabels();
  rebuildKernel();
  placeCells(cellData);
}

function selectAnimalByIndex(index) {
  const form = libraryForms.find((item) => item.index === index);
  if (!form) return;
  selectLibraryForm(form.id);
  loadSelectedForm();
}

function selectAnimalCode(code) {
  const source = Array.isArray(window.animalArr) ? window.animalArr : [];
  for (let i = 0; i < source.length; i += 1) {
    const rawCode = source[i]?.[0] || "";
    if (rawCode === code || rawCode.split("(")[0] === code) {
      selectAnimalByIndex(i);
      return;
    }
  }
}

function getAnimalItemById(index) {
  if (index == null) return null;
  return ui.animalList.querySelector(`[data-animalid="${index}"]`);
}

function highlightAnimalItem(item) {
  if (selectedAnimalItem) selectedAnimalItem.classList.remove("selected");
  if (!item) {
    selectedAnimalItem = null;
    return;
  }
  item.classList.add("selected");
  let node = item.parentElement;
  while (node) {
    if (node.classList?.contains("closed")) node.classList.remove("closed");
    node = node.parentElement;
  }
  ui.animalWindow.scrollTop = Math.max(0, item.offsetTop - ui.animalWindow.clientHeight / 2);
  selectedAnimalItem = item;
}

function openAllGroups(isOpen, prefix) {
  const groups = ui.animalList.querySelectorAll(".group");
  for (const group of groups) {
    const text = group.firstElementChild?.textContent || "";
    if (prefix == null || text.startsWith(prefix)) group.classList.toggle("closed", !isOpen);
  }
}

function defaultGroups() {
  openAllGroups(false);
  openAllGroups(true, "class:");
  openAllGroups(true, "order:");
  openAllGroups(true, "subfamily:");
}

function populateCatalogue() {
  const source = Array.isArray(window.catalogueArr) ? window.catalogueArr : [];
  ui.catalogue.innerHTML = "";
  for (const row of source) {
    const tr = document.createElement("tr");
    for (const entry of row) {
      const [src, code, english, chinese] = entry;
      const td = document.createElement("td");
      const img = document.createElement("img");
      img.src = `assets/${src}`;
      img.alt = english;
      img.title = `${english} ${chinese}`.trim();
      img.className = "cat-img";
      img.addEventListener("click", () => {
        defaultGroups();
        selectAnimalCode(code);
      });
      td.append(img);
      tr.append(td);
    }
    ui.catalogue.append(tr);
  }
}

function populateAnimalList() {
  const source = Array.isArray(window.animalArr) ? window.animalArr : [];
  ui.animalList.innerHTML = "";
  let node = ui.animalList;
  let currentLevel = 0;
  let lastCode = "";
  let lastEnglishRoot = "";
  let lastChineseRoot = "";

  for (let i = 0; i < source.length; i += 1) {
    const item = source[i];
    if (!Array.isArray(item) || item.length < 3) continue;

    let codeText = displayCode(String(item[0]).split("(")[0]);
    const englishParts = String(item[1] || "").split(" ");
    const chineseParts = String(item[2] || "").split("(");
    const sameCode = codeText !== "" && codeText === lastCode;
    const sameEnglishRoot = englishParts[0] !== "" && englishParts[0] === lastEnglishRoot;
    const sameChineseRoot = chineseParts[0] !== "" && chineseParts[0] === lastChineseRoot;
    lastCode = codeText;
    lastEnglishRoot = englishParts[0];
    lastChineseRoot = chineseParts[0];

    if (item.length >= 4) {
      const ruleText = splitLifeformPayload(item[3]).rule;
      const li = document.createElement("li");
      li.className = "action";
      li.dataset.animalid = String(i);
      li.title = `${item[0]} ${item[1]} ${item[2]}\n${ruleText}`;
      if (sameCode) codeText = "-".repeat(codeText.length);
      if (sameEnglishRoot) englishParts[0] = `${lastEnglishRoot.substring(0, 1)}.`;
      if (sameChineseRoot) chineseParts[0] = "~";
      li.innerHTML = `
        <span class="animal-code">${codeText}</span>
        <span class="animal-name">${englishParts.join(" ")}</span>
        <span class="animal-layer">${layerLabel(ruleText)}</span>
      `;
      li.addEventListener("click", () => selectAnimalByIndex(i));
      node.append(li);
      continue;
    }

    const nextLevel = Number.parseInt(codeText.substring(1), 10) || 1;
    const diffLevel = nextLevel - currentLevel;
    const backCount = diffLevel <= 0 ? -diffLevel + 1 : 0;
    const forwardCount = diffLevel > 0 ? diffLevel : 1;
    for (let k = 0; k < backCount; k += 1) {
      node = node.parentElement;
      if (node.tagName === "LI") node = node.parentElement;
    }

    const li = document.createElement("li");
    li.className = "group";
    const div = document.createElement("div");
    div.title = `${englishParts.join(" ")} ${chineseParts.join("(")}`.trim();
    div.textContent = `${englishParts.join(" ")} ${chineseParts[0].split(" ")[0]}`.trim();
    div.addEventListener("click", () => li.classList.toggle("closed"));
    li.append(div);
    node.append(li);
    node = li;
    for (let k = 0; k < forwardCount; k += 1) {
      const ul = document.createElement("ul");
      node.append(ul);
      node = ul;
    }
    currentLevel = nextLevel;
  }

  defaultGroups();
}

function setBrushMode(mode) {
  brushMode = mode;
  ui.paintBtn.classList.toggle("active", mode === "paint");
  ui.eraseBtn.classList.toggle("active", mode === "erase");
  ui.sampleBtn.classList.toggle("active", mode === "sample");
}

function canvasPoint(event) {
  const rect = fieldCanvas.getBoundingClientRect();
  return {
    x: Math.floor(((event.clientX - rect.left) / rect.width) * size),
    y: Math.floor(((event.clientY - rect.top) / rect.height) * size),
  };
}

function paintAt(x, y) {
  if (brushMode === "sample") {
    ui.sampleLabel.textContent = field[indexOf(x, y)].toFixed(3);
    return;
  }

  const radius = brushSize;
  const power = Number(ui.brushPowerSlider.value);
  const value = brushMode === "paint" ? 0.95 : 0;
  for (let oy = -radius; oy <= radius; oy += 1) {
    for (let ox = -radius; ox <= radius; ox += 1) {
      const d = Math.hypot(ox, oy);
      if (d > radius) continue;
      const falloff = 1 - d / Math.max(1, radius);
      const i = indexOf(x + ox, y + oy);
      field[i] =
        brushMode === "paint"
          ? clamp(field[i] + value * falloff * power)
          : clamp(field[i] * (1 - falloff * 0.6));
    }
  }
  measureField();
  renderAll();
}

function bindEvents() {
  ui.runBtn.addEventListener("click", () => setRunning(!isRunning));
  ui.stepBtn.addEventListener("click", () => {
    stepSimulation();
    renderAll();
  });
  ui.resetBtn.addEventListener("click", () => applyPreset(ui.presetSelect.value));
  ui.clearBtn.addEventListener("click", clearField);
  ui.randomBtn.addEventListener("click", randomizeField);
  ui.presetSelect.addEventListener("change", () => applyPreset(ui.presetSelect.value));
  ui.paintBtn.addEventListener("click", () => setBrushMode("paint"));
  ui.eraseBtn.addEventListener("click", () => setBrushMode("erase"));
  ui.sampleBtn.addEventListener("click", () => setBrushMode("sample"));

  ui.brushSlider.addEventListener("input", () => {
    brushSize = Number(ui.brushSlider.value);
    syncControlLabels();
  });
  ui.brushPowerSlider.addEventListener("input", syncControlLabels);

  ui.sizeSelect.addEventListener("change", () => {
    resizeWorld(Number(ui.sizeSelect.value));
    rebuildKernel();
    renderAll();
  });

  const liveSliders = [
    ui.radiusSlider,
    ui.alphaSlider,
    ui.muSlider,
    ui.sigmaSlider,
    ui.dtSlider,
    ui.gainSlider,
    ui.decaySlider,
    ui.fpsCapSlider,
    ui.stepsSlider,
  ];
  for (const slider of liveSliders) {
    slider.addEventListener("input", () => {
      syncControlLabels();
      if (slider === ui.radiusSlider || slider === ui.alphaSlider) rebuildKernel();
      renderAll();
    });
  }
  ui.paletteSelect.addEventListener("change", renderAll);

  let pointerDown = false;
  fieldCanvas.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    fieldCanvas.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    paintAt(point.x, point.y);
  });
  fieldCanvas.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    const point = canvasPoint(event);
    paintAt(point.x, point.y);
  });
  fieldCanvas.addEventListener("pointerup", () => {
    pointerDown = false;
  });
  fieldCanvas.addEventListener("pointerleave", () => {
    pointerDown = false;
  });

  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, select, button")) return;
    if (event.key === " ") {
      event.preventDefault();
      setRunning(!isRunning);
    } else if (event.key.toLowerCase() === "r") {
      applyPreset(ui.presetSelect.value);
    } else if (event.key.toLowerCase() === "n") {
      randomizeField();
    }
  });
}

function boot() {
  libraryForms = buildLibraryForms();
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
  const defaultForm =
    libraryForms.find((form) => form.rawCode === "O2(a)") || libraryForms[0];
  if (defaultForm) {
    selectLibraryForm(defaultForm.id);
    loadSelectedForm();
  } else {
    applyPreset("orbium");
  }
  setBrushMode("paint");
  setRunning(false);
  requestAnimationFrame(tick);
}

boot();
